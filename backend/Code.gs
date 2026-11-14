/* V4AIR forms backend: Google Sheet + Apps Script web app.
   Bound to the "V4AIR forms" spreadsheet (created by clasp create --type sheets).
   Tabs: Applications (form A), Nominations and Nominees (form B), Speakers (form S).
   Spec: forms/survey-spec.md sections 5.2 (save and resume), 5.11 (export), 5.17 (IDs). */

var ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
var META = ['response_id', 'token_hash', 'status', 'started_at', 'last_saved_at', 'submitted_at', 'screen', 'answers_json'];
var NOMINEE_COLS = ['nomination_id', 'application_id', 'nominator_name', 'nominator_email', 'n', 'type', 'name', 'contact', 'affiliation', 'why', 'saved_at'];
var FORMS = {
  A: { tab: 'Applications', prefix: 'V4A', keyRe: /^A[1-8]\.[A-Za-z0-9_.]+$/ },
  B: { tab: 'Nominations', prefix: 'V4N', keyRe: /^B\.[A-Za-z0-9_.]+$/ },
  /* invited speakers (public/invited-speaker/): shared questions keep the A variable IDs, speaker-only ones are S.* */
  S: { tab: 'Speakers', prefix: 'V4S', keyRe: /^(A[1-8]|S)\.[A-Za-z0-9_.]+$/ }
};
var MAX_BODY = 15000000, MAX_VALUE = 12000, MAX_JSON = 49000, MAX_KEYS = 800, MAX_CARDS = 9; /* a Sheets cell holds 50,000 characters */
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* A7 upload (form A) and speaker photo (form S): one file per record, kept under its original name in "V4AIR uploads/<application id>/" */
var UPLOAD_ROOT = 'V4AIR uploads', MAX_FILE = 10 * 1024 * 1024;
var FILE_TYPES = { 'application/pdf': 'pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx', 'image/png': 'png', 'image/jpeg': 'jpg' };

/* ---------- entry points ---------- */

function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents) || '';
    if (body.length > MAX_BODY) return reply({ ok: false, error: 'too_large' });
    var req = JSON.parse(body);
    if (req.hp) return reply({ ok: true, id: 'V4X-0000-0000', token: '' }); /* honeypot: pretend success, store nothing */
    if (req.action === 'load') return reply(load(req));
    if (req.action === 'save') return reply(save(req));
    return reply({ ok: false, error: 'bad_action' });
  } catch (err) {
    var msg = String(err && err.message || err);
    if (/^file_(type|size)$/.test(msg)) return reply({ ok: false, error: msg });
    console.error(err && err.stack || err);
    return reply({ ok: false, error: 'server' });
  }
}

function doGet() {
  return reply({ ok: true, service: 'v4air-forms' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor as petkout1: creates the tabs and triggers the OAuth consent. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['A', 'B'].forEach(function (f) { sheetFor(f); });
  var nom = ss.getSheetByName('Nominees') || ss.insertSheet('Nominees');
  if (nom.getLastColumn() === 0) { nom.getRange(1, 1, 1, NOMINEE_COLS.length).setValues([NOMINEE_COLS]); nom.setFrozenRows(1); }
  var first = ss.getSheets()[0];
  if (first.getName() === 'Sheet1' && first.getLastRow() === 0) ss.deleteSheet(first);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('EMAIL_ENABLED')) props.setProperty('EMAIL_ENABLED', 'false');
  if (!props.getProperty('SITE_URL')) props.setProperty('SITE_URL', '');
  if (!props.getProperty('MAIL_SINCE')) props.setProperty('MAIL_SINCE', new Date().toISOString());
  MailApp.getRemainingDailyQuota(); /* touches the mail scope so consent covers it */
  UrlFetchApp.getRequest('https://api.resend.com/emails'); /* same for external requests (Resend); sends nothing */
  if (!props.getProperty('RESEND_API_KEY') && GmailApp.getAliases().indexOf(MAIL_FROM) === -1) throw new Error('Gmail cannot send as ' + MAIL_FROM);
  uploadRoot(); /* same for Drive */
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sendMail'; })) ScriptApp.newTrigger('sendMail').timeBased().everyMinutes(5).create();
}

/* ---------- actions ---------- */

function load(req) {
  var f = FORMS[req.form];
  if (!f || !req.id || !req.token) return { ok: false, error: 'bad_request' };
  var sh = sheetFor(req.form);
  var row = findRow(sh, req.id);
  if (!row) return { ok: false, error: 'not_found' };
  var head = header(sh);
  var vals = sh.getRange(row, 1, 1, head.length).getValues()[0];
  if (!tokenOk(vals[head.indexOf('token_hash')], req.token)) return { ok: false, error: 'not_found' };
  return { ok: true, id: req.id, status: vals[head.indexOf('status')], answers: JSON.parse(vals[head.indexOf('answers_json')] || '{}') };
}

function save(req) {
  var f = FORMS[req.form];
  if (!f || !req.answers || typeof req.answers !== 'object') return { ok: false, error: 'bad_request' };
  var answers = clean(req.answers, f.keyRe);
  if (JSON.stringify(answers.json).length > MAX_JSON) return { ok: false, error: 'too_large' };
  var email = String(req.answers[req.form === 'B' ? 'B.email' : 'A1.email'] || '').trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'email' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var created = false, id = req.id, token = req.token, now = new Date();
  try {
    /* one header read and one row read per save; every Sheets call costs 0.2 to 1 s inside Apps Script */
    var sh = sheetFor(req.form);
    var head = header(sh);
    var row = id ? findRow(sh, id) : 0, rec = {};
    if (row) {
      var cur = sh.getRange(row, 1, 1, head.length).getValues()[0];
      head.forEach(function (h, i) { rec[h] = cur[i]; });
      if (!tokenOk(rec.token_hash, token)) return { ok: false, error: 'not_found' };
    } else {
      /* no record yet, or a stale id the sheet doesn't know: start a new record.
         32^8 ids, so no lookup for collisions */
      id = newId(f.prefix);
      token = newToken();
      row = sh.getLastRow() + 1;
      created = true;
      rec.response_id = id; rec.token_hash = hash(token); rec.started_at = now; rec.status = 'in progress';
    }
    rec.last_saved_at = now;
    rec.screen = typeof req.answers.__screen === 'number' ? req.answers.__screen : '';
    rec.answers_json = JSON.stringify(answers.json);
    /* GA4 client id (the _ga cookie value); joins a row to its traffic source in GA */
    if (typeof req.ga_cid === 'string' && /^[0-9.]{1,40}$/.test(req.ga_cid)) rec.ga_client_id = req.ga_cid;
    if (req.final) { rec.status = 'submitted'; if (!rec.submitted_at) rec.submitted_at = now; }
    Object.keys(answers.flat).forEach(function (k) { rec[k] = answers.flat[k]; });
    if ((req.form === 'A' || req.form === 'S') && (req.file || req.removeFile)) {
      var stored = storeFile(id, req.file), col = req.form === 'S' ? 'S.photo' : 'A7.file';
      answers.json.__file = stored;
      rec.answers_json = JSON.stringify(answers.json);
      rec[col + '_name'] = stored ? stored.name : '';
      rec[col + '_url'] = stored ? stored.url : '';
    }
    head = addColumns(sh, head, Object.keys(rec));
    /* the whole row is rewritten, so text read from the sheet needs the same protection as new answers */
    sh.getRange(row, 1, 1, head.length).setValues([head.map(function (h) { return !(h in rec) ? '' : typeof rec[h] === 'string' ? cellText(rec[h]) : rec[h]; })]);
    if (req.form === 'B' && req.final) writeNominees(id, answers.json, now);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  var out = { ok: true, id: id, token: token, created: created };
  if ('__file' in answers.json) out.file = answers.json.__file;
  return out;
}

/* ---------- uploads ---------- */

function uploadRoot() {
  var it = DriveApp.getFoldersByName(UPLOAD_ROOT);
  return it.hasNext() ? it.next() : DriveApp.createFolder(UPLOAD_ROOT);
}

/* Replaces whatever is in the applicant's folder with the new file; null file = remove only. Returns {name, size, url} or null. */
function storeFile(id, file) {
  var root = uploadRoot();
  var it = root.getFoldersByName(id);
  var folder = it.hasNext() ? it.next() : null;
  if (folder) { var old = folder.getFiles(); while (old.hasNext()) old.next().setTrashed(true); }
  if (!file) return null;
  if (!file.data || typeof file.data !== 'string' || !FILE_TYPES[file.type]) throw new Error('file_type');
  var bytes = Utilities.base64Decode(file.data);
  if (bytes.length > MAX_FILE) throw new Error('file_size');
  var name = String(file.name || 'upload').replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 200);
  if (!new RegExp('\\.' + FILE_TYPES[file.type] + '$', 'i').test(name) && !(file.type === 'image/jpeg' && /\.jpeg$/i.test(name))) name += '.' + FILE_TYPES[file.type];
  if (!folder) folder = root.createFolder(id);
  var f = folder.createFile(Utilities.newBlob(bytes, file.type, name));
  return { name: f.getName(), size: bytes.length, url: f.getUrl() };
}

/* ---------- sheet helpers ---------- */

function sheetFor(form) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = FORMS[form].tab;
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, META.length).setValues([META]);
    sh.setFrozenRows(1);
    sh.setFrozenColumns(1);
  }
  return sh;
}

function header(sh) {
  var n = sh.getLastColumn();
  return n ? sh.getRange(1, 1, 1, n).getValues()[0].map(String) : [];
}

/* Appends a column for every answer key not yet in the header, in the order the form sends them. */
function ensureColumns(sh, keys) {
  var head = header(sh);
  var missing = keys.filter(function (k) { return head.indexOf(k) === -1; });
  if (missing.length) {
    if (sh.getMaxColumns() < head.length + missing.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length + missing.length - sh.getMaxColumns());
    sh.getRange(1, head.length + 1, 1, missing.length).setValues([missing]);
    head = head.concat(missing);
  }
  return head;
}

/* Same as ensureColumns, with the header already in hand (saves a read). */
function addColumns(sh, head, keys) {
  var missing = keys.filter(function (k) { return head.indexOf(k) === -1; });
  if (!missing.length) return head;
  if (sh.getMaxColumns() < head.length + missing.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length + missing.length - sh.getMaxColumns());
  sh.getRange(1, head.length + 1, 1, missing.length).setValues([missing]);
  return head.concat(missing);
}

function newId(prefix) {
  var out = '';
  for (var i = 0; i < 8; i++) { out += ID_ALPHABET.charAt(Math.floor(Math.random() * ID_ALPHABET.length)); if (i === 3) out += '-'; }
  return prefix + '-' + out;
}

function findRow(sh, id) {
  if (!/^V4[ANCS]-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(String(id))) return 0;
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var hit = sh.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function rowObject(sh, row, head) {
  var vals = sh.getRange(row, 1, 1, head.length).getValues()[0], o = {};
  head.forEach(function (h, i) { o[h] = vals[i]; });
  return o;
}

function uniqueId(sh, prefix) {
  for (var tries = 0; tries < 20; tries++) {
    var out = '';
    for (var i = 0; i < 8; i++) { out += ID_ALPHABET.charAt(Math.floor(Math.random() * ID_ALPHABET.length)); if (i === 3) out += '-'; }
    var id = prefix + '-' + out;
    if (!findRow(sh, id)) return id;
  }
  throw new Error('could not generate a unique id');
}

function writeNominees(nominationId, json, now) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Nominees');
  var last = sh.getLastRow();
  /* resubmission replaces this nomination's rows */
  if (last >= 2) {
    var ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var r = ids.length - 1; r >= 0; r--) if (ids[r][0] === nominationId) sh.deleteRow(r + 2);
  }
  var rows = (json.__cards || []).map(function (c, i) {
    return [nominationId, json['B.application_id'] || '', json['B.name'] || '', json['B.email'] || '', i + 1, c.type, c.name, c.contact, c.affiliation, c.why]
      .map(function (v) { return typeof v === 'string' ? cellText(v) : v; }).concat([now]);
  });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, NOMINEE_COLS.length).setValues(rows);
}

/* ---------- input hygiene ---------- */

/* Keeps only known key shapes and caps sizes.
   flat = one sheet column per variable; json = what resume restores (includes __keywords, __cards). */
function clean(answers, keyRe) {
  var flat = {}, json = {}, n = 0;
  Object.keys(answers).forEach(function (k) {
    if (n >= MAX_KEYS) return;
    var v = answers[k];
    if (/^(A7\.file|S\.photo)_(name|url)$/.test(k)) return; /* server-owned columns */
    if (keyRe.test(k)) {
      if (typeof v === 'boolean') { flat[k] = v; json[k] = v; n++; }
      else if (typeof v === 'string' || typeof v === 'number') { var s = String(v).slice(0, MAX_VALUE); flat[k] = s; json[k] = s; n++; }
    } else if (k === '__keywords' && Array.isArray(answers[k])) {
      json[k] = v.slice(0, 5).map(function (x) { return String(x).slice(0, 200); });
    } else if (k === '__cards' && Array.isArray(v)) {
      json[k] = v.slice(0, MAX_CARDS).map(function (c) {
        c = c || {};
        return { type: String(c.type || '').slice(0, 20), name: String(c.name || '').slice(0, 300), contact: String(c.contact || '').slice(0, 300), affiliation: String(c.affiliation || '').slice(0, 300), why: String(c.why || '').slice(0, 1000) };
      });
    } else if (k === '__screen' || k === '__prefilled') {
      json[k] = v;
    } else if (k === '__layout' && typeof v === 'number') {
      json[k] = v; /* screen order the __screen index refers to; see LAYOUT in public/apply/index.html */
    } else if (k === '__file' && v && typeof v === 'object') {
      /* what the client remembers about an earlier upload; the server copy is rewritten whenever a file is sent */
      json[k] = { name: String(v.name || '').slice(0, 200), size: +v.size || 0, url: /^https:\/\/(drive|docs)\.google\.com\//.test(v.url) ? v.url : '' };
    }
  });
  return { flat: flat, json: json };
}

/* A leading apostrophe makes Sheets keep the cell as typed, so =1+1, 0123, 1/2, 50% and TRUE are not read as formulas, numbers or dates.
   Plain whole numbers stay numbers. */
function cellText(s) { return s === '' || /^(0|[1-9][0-9]{0,14})$/.test(s) ? s : "'" + s; }

/* token_hash holds the browser's token plus one more per email sent, separated by spaces. Plain tokens are never stored. */
function tokenOk(stored, token) { return !!token && String(stored).split(' ').indexOf(hash(token)) !== -1; }
function newToken() { return Utilities.getUuid() + Utilities.getUuid().slice(0, 8); }

function hash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/* ---------- email ---------- */

/* Gmail path: Peter's verified Gmail alias. A consumer Gmail account sends to about 100 recipients a day.
   Gmail drops "Send mail as" for third-party addresses in January 2027, so mail goes through Resend once the
   script property RESEND_API_KEY is set: from RESEND_FROM (default info@v4air.eu), DKIM-signed for v4air.eu. Free plan: 100 a day. */
var MAIL_FROM = 'peter@v4air.eu', MAIL_NAME = 'V4 AI Researchers Meetup', MAIL_REPLY = 'info@v4air.eu';
var RESEND_FROM = 'info@v4air.eu', RESEND_DAILY = 100;
/* Secrets reach the script without the editor: a JSON file with this name in petkout1's My Drive, e.g.
   {"RESEND_API_KEY": "re_...", "UNSUB_SECRET": "..."}, is read into script properties on the next run and trashed.
   Only the keys listed here are accepted. */
var SECRETS_FILE = 'v4air-script-secrets.json', SECRET_KEYS = ['RESEND_API_KEY', 'UNSUB_SECRET', 'RESEND_FROM'];
var MAIL_BATCH = 5; /* the script lock is held during a run, and saves through Apps Script wait for it at most 20 s */
var RESUME_AFTER_MS = 24 * 60 * 60 * 1000;
/* example.com, .net and .org are reserved and never receive mail (RFC 2606); the form tests use them, so their rows are marked, not mailed */
var TEST_ADDRESS = /@example\.(com|net|org)$/i;

/* Runs every 5 minutes (setup() makes the trigger). This is the only sender, because the Worker cannot send mail.
   The sheet is the queue: confirm_sent_at and resume_sent_at say what went out, so a missed run or an empty quota only delays mail.
   Script properties: EMAIL_ENABLED=true, SITE_URL (site root, default https://v4air.eu/), MAIL_SINCE (rows last saved before this date are never mailed),
   MAIL_MODE: 'dry' (default when unset) or 'live'.
   Dry run: every run rewrites the tab "Mail preview" with each email that is due now and every row that would be skipped, and why.
   Nothing is sent, no row is marked, no token is created. Real mail needs MAIL_MODE=live AND EMAIL_ENABLED=true. */
var PREVIEW_TAB = 'Mail preview', UNSUB_TAB = 'Unsubscribed';
function sendMail() {
  var props = PropertiesService.getScriptProperties();
  importSecrets(props);
  var site = (props.getProperty('SITE_URL') || 'https://v4air.eu/').replace(/\/?$/, '/');
  var since = new Date(props.getProperty('MAIL_SINCE') || NaN);
  var live = props.getProperty('MAIL_MODE') === 'live';
  if (!/^https:\/\//.test(site) || isNaN(since)) return;
  if (live && props.getProperty('EMAIL_ENABLED') !== 'true') return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    if (!live) { writePreview(site, since); return; }
    var left = Math.min(MAIL_BATCH, props.getProperty('RESEND_API_KEY') ? RESEND_DAILY : MailApp.getRemainingDailyQuota());
    ['A', 'S'].forEach(function (form) { if (left > 0) left -= mailTab(form, site, since, left); });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

/* What is due on one tab, without changing anything. Confirmations first, once per row.
   A resume email goes once, a day after the last save, if the form is still unfinished.
   Each item: {form, kind, row, mark (0-based column of *_sent_at), to, id, name, skip ('' or the reason)}. */
function dueMail(form, since) {
  var sh = sheetFor(form), head = header(sh), last = sh.getLastRow(), now = new Date(), col = {}, out = [];
  if (last < 2) return { sh: sh, head: head, items: out };
  head.forEach(function (h, i) { col[h] = i; });
  var rows = sh.getRange(2, 1, last - 1, head.length).getValues(), unsub = unsubscribed(), done = {};
  /* addresses that already sent this form: their unfinished drafts get no reminder (the "V4AIR form emails" Doc rule) */
  rows.forEach(function (r) { if (r[col.status] === 'submitted') done[String(r[col['A1.email']] || '').trim().toLowerCase()] = true; });
  ['confirm', 'resume'].forEach(function (kind) {
    var mark = col[kind + '_sent_at'];
    rows.forEach(function (r, i) {
      var saved = r[col.last_saved_at];
      if (mark !== undefined && r[mark]) return; /* already sent or marked */
      if (kind === 'confirm' ? r[col.status] !== 'submitted' : r[col.status] !== 'in progress') return;
      var to = String(r[col['A1.email']] || '').trim(), skip = '';
      if (!(saved instanceof Date)) skip = 'no last_saved_at';
      else if (saved < since) skip = 'saved before MAIL_SINCE (' + Utilities.formatDate(since, 'Europe/Prague', 'dd.MM.yyyy HH:mm') + ')';
      else if (kind === 'resume' && now - saved < RESUME_AFTER_MS) skip = 'not yet: resume goes 24 h after the last save';
      else if (TEST_ADDRESS.test(to)) skip = 'test address';
      else if (!to) skip = 'no email';
      else if (kind !== 'confirm' && unsub[to.toLowerCase()]) skip = 'unsubscribed';
      else if (kind === 'resume' && done[to.toLowerCase()]) skip = 'same email already submitted this form';
      out.push({ form: form, kind: kind, row: i + 2, mark: mark, to: to, id: r[col.response_id], name: String(r[col['A1.name']] || '').trim(), skip: skip, tokenCol: col.token_hash, tokenHash: r[col.token_hash] });
    });
  });
  return { sh: sh, head: head, items: out };
}

function unsubscribed() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UNSUB_TAB), set = {};
  if (!sh || sh.getLastRow() < 2) return set;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { var e = String(r[0] || '').trim().toLowerCase(); if (e) set[e] = true; });
  return set;
}

function mailTab(form, site, since, max) {
  var sh = sheetFor(form);
  addColumns(sh, header(sh), ['confirm_sent_at', 'resume_sent_at']);
  var due = dueMail(form, since), sent = 0;
  due.items.forEach(function (it) {
    if (sent >= max) return;
    if (it.skip === 'test address') { sh.getRange(it.row, it.mark + 1).setValue('skipped: test address'); return; }
    if (it.skip) return;
    var token = newToken();
    sh.getRange(it.row, it.tokenCol + 1).setValue(it.tokenHash + ' ' + hash(token));
    var m = emailText(form, it.kind, it.id, it.name, mailLink(site, form, it.id, token)), result = new Date();
    try {
      deliver(it.to, m.subject, m.body);
    } catch (err) {
      console.error('mail failed: ' + form + ' ' + it.kind + ' ' + it.id + ': ' + err); /* marked, so one bad address cannot block the queue */
      result = 'failed';
    }
    sh.getRange(it.row, it.mark + 1).setValue(result);
    sent++;
  });
  return sent;
}

function mailLink(site, form, id, token) {
  return site + (form === 'S' ? 'invited-speaker/' : 'apply/') + '?id=' + encodeURIComponent(id) + '&t=' + encodeURIComponent(token);
}

/* Dry run output: one row per due or skipped email, rewritten on every run. */
function writePreview(site, since) {
  var props = PropertiesService.getScriptProperties(), resend = !!props.getProperty('RESEND_API_KEY');
  var from = resend ? MAIL_NAME + ' <' + (props.getProperty('RESEND_FROM') || RESEND_FROM) + '> via Resend' : MAIL_NAME + ' <' + MAIL_FROM + '> via Gmail';
  var stamp = Utilities.formatDate(new Date(), 'Europe/Prague', 'dd.MM.yyyy HH:mm');
  var rows = [['generated_at', 'would_send', 'skip_reason', 'form', 'kind', 'response_id', 'to', 'from', 'subject', 'body', 'unsubscribe_link']];
  ['A', 'S'].forEach(function (form) {
    dueMail(form, since).items.forEach(function (it) {
      var m = emailText(form, it.kind, it.id, it.name, mailLink(site, form, it.id, '<personal token, made at send time>'));
      rows.push([stamp, it.skip ? 'no' : 'yes', it.skip, form, it.kind, it.id, it.to, from, m.subject, m.body, it.skip ? '' : unsubscribeLink(it.to)]);
    });
  });
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(PREVIEW_TAB) || ss.insertSheet(PREVIEW_TAB);
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

/* One email. Resend when RESEND_API_KEY is set, otherwise Gmail as before. Throws on failure, so the caller marks the row 'failed'. */
function deliver(to, subject, body) {
  var props = PropertiesService.getScriptProperties(), key = props.getProperty('RESEND_API_KEY');
  var unsub = unsubscribeLink(to);
  if (!key) {
    GmailApp.sendEmail(to, subject, body, { from: MAIL_FROM, name: MAIL_NAME, replyTo: MAIL_REPLY });
    return;
  }
  var msg = { from: MAIL_NAME + ' <' + (props.getProperty('RESEND_FROM') || RESEND_FROM) + '>', to: [to], reply_to: MAIL_REPLY, subject: subject, text: body };
  /* RFC 8058 one-click: mail apps show an Unsubscribe button and POST to the link; the Worker accepts that POST */
  if (unsub) msg.headers = { 'List-Unsubscribe': '<' + unsub + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  var res = UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + key }, payload: JSON.stringify(msg)
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Resend ' + code + ': ' + res.getContentText().slice(0, 300));
}

/* https://v4air.eu/unsubscribe/?e=<base64url email>&t=<base64url HMAC-SHA256(UNSUB_SECRET, email)>, the format the Worker checks.
   Empty while UNSUB_SECRET is not set. */
function unsubscribeLink(email) {
  var secret = PropertiesService.getScriptProperties().getProperty('UNSUB_SECRET');
  if (!secret) return '';
  var e = String(email).trim().toLowerCase(), b64 = function (x) { return Utilities.base64EncodeWebSafe(x).replace(/=+$/, ''); };
  return 'https://v4air.eu/unsubscribe/?e=' + b64(Utilities.newBlob(e).getBytes()) + '&t=' + b64(Utilities.computeHmacSha256Signature(e, secret));
}

function importSecrets(props) {
  var files = DriveApp.getRootFolder().getFilesByName(SECRETS_FILE);
  while (files.hasNext()) {
    var f = files.next(), data;
    try { data = JSON.parse(f.getBlob().getDataAsString()); } catch (e) { console.error(SECRETS_FILE + ' is not valid JSON'); data = {}; }
    var got = SECRET_KEYS.filter(function (k) { return typeof data[k] === 'string' && data[k]; });
    got.forEach(function (k) { props.setProperty(k, data[k]); });
    console.log('secrets imported: ' + (got.join(', ') || 'none'));
    f.setTrashed(true);
  }
}

function emailText(form, kind, id, name, link) {
  var hello = 'Hello' + (name ? ' ' + name : '') + ',\n\n';
  var personal = 'This link is personal. Anyone who has it can open your answers, so please do not forward this email.\n\n';
  var end = 'If you have a question, reply to this email.\n\nV4 AI Researchers Meetup (V4AIR)\nKostelec Castle, 28 to 30 April 2027\nhttps://v4air.eu\n';
  var once = 'If you have changed your mind, you can ignore this email.\n\n';
  if (form === 'A' && kind === 'resume') return { subject: 'Your V4AIR application is saved', body: hello +
    'You started an application for the V4 AI Researchers Meetup (V4AIR). Your answers are saved, and you can continue on any device through this link:\n\n' + link + '\n\n' +
    'Applications close on 15 January 2027. Your application ID is ' + id + '.\n\n' + personal + once + end };
  if (form === 'A') return { subject: 'We received your V4AIR application ' + id, body: hello +
    'Thank you. We received your application for the V4 AI Researchers Meetup (V4AIR).\n\nYour application ID: ' + id + '\nKeep it. It is in every email we send you about the meetup.\n\n' +
    'You can change your answers until 15 January 2027 through this link:\n\n' + link + '\n\n' + personal + 'Selection results come in February 2027.\n\n' + end };
  if (kind === 'resume') return { subject: 'Your V4AIR speaker form is saved', body: hello +
    'You started the speaker form for the V4 AI Researchers Meetup (V4AIR). Your answers are saved, and you can finish the form on any device through this link:\n\n' + link + '\n\n' +
    'Your reference is ' + id + '.\n\n' + personal + once + end };
  return { subject: 'We received your V4AIR speaker form', body: hello +
    'Thank you. We have your answers for the V4 AI Researchers Meetup (V4AIR).\n\nYour reference: ' + id + '\n\n' +
    'We will write to you about the next steps. If anything changes, you can update your answers through this link:\n\n' + link + '\n\n' + personal + end };
}
