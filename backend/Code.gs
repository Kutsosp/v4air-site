/* V4AIR forms backend: Google Sheet + Apps Script web app.
   Bound to the "V4AIR forms" spreadsheet (created by clasp create --type sheets).
   Tabs: Applications (form A), Nominations and Nominees (form B).
   Spec: forms/survey-spec.md sections 5.2 (save and resume), 5.11 (export), 5.17 (IDs). */

var ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
var META = ['response_id', 'token_hash', 'status', 'started_at', 'last_saved_at', 'submitted_at', 'screen', 'answers_json'];
var NOMINEE_COLS = ['nomination_id', 'application_id', 'nominator_name', 'nominator_email', 'n', 'type', 'name', 'contact', 'affiliation', 'why', 'saved_at'];
var FORMS = {
  A: { tab: 'Applications', prefix: 'V4A', keyRe: /^A[1-8]\.[A-Za-z0-9_.]+$/ },
  B: { tab: 'Nominations', prefix: 'V4N', keyRe: /^B\.[A-Za-z0-9_.]+$/ }
};
var MAX_BODY = 15000000, MAX_VALUE = 12000, MAX_KEYS = 800, MAX_CARDS = 9;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* A7 upload: one file per application, kept under its original name in "V4AIR uploads/<application id>/" */
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
  MailApp.getRemainingDailyQuota(); /* touches the mail scope so consent covers it */
  uploadRoot(); /* same for Drive */
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
  if (vals[head.indexOf('token_hash')] !== hash(req.token)) return { ok: false, error: 'not_found' };
  return { ok: true, id: req.id, status: vals[head.indexOf('status')], answers: JSON.parse(vals[head.indexOf('answers_json')] || '{}') };
}

function save(req) {
  var f = FORMS[req.form];
  if (!f || !req.answers || typeof req.answers !== 'object') return { ok: false, error: 'bad_request' };
  var answers = clean(req.answers, f.keyRe);
  var email = String(req.answers[req.form === 'A' ? 'A1.email' : 'B.email'] || '').trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'email' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var created = false, id = req.id, token = req.token, wasSubmitted = false, now = new Date();
  try {
    var sh = sheetFor(req.form);
    var row = id ? findRow(sh, id) : 0;
    if (row) {
      var head0 = header(sh);
      var cur = sh.getRange(row, 1, 1, head0.length).getValues()[0];
      if (!token || cur[head0.indexOf('token_hash')] !== hash(token)) return { ok: false, error: 'not_found' };
      wasSubmitted = cur[head0.indexOf('status')] === 'submitted';
    } else {
      /* no record yet, or a stale id the sheet doesn't know: start a new record */
      id = uniqueId(sh, f.prefix);
      token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
      row = sh.getLastRow() + 1;
      created = true;
    }
    var head = ensureColumns(sh, Object.keys(answers.flat));
    var rec = created ? {} : rowObject(sh, row, head);
    if (created) { rec.response_id = id; rec.token_hash = hash(token); rec.started_at = now; rec.status = 'in progress'; }
    rec.last_saved_at = now;
    rec.screen = typeof req.answers.__screen === 'number' ? req.answers.__screen : '';
    rec.answers_json = JSON.stringify(answers.json);
    if (req.final) { rec.status = 'submitted'; if (!rec.submitted_at) rec.submitted_at = now; }
    Object.keys(answers.flat).forEach(function (k) { rec[k] = answers.flat[k]; });
    if (req.form === 'A' && (req.file || req.removeFile)) {
      var stored = storeFile(id, req.file);
      answers.json.__file = stored;
      rec.answers_json = JSON.stringify(answers.json);
      rec['A7.file_name'] = stored ? stored.name : '';
      rec['A7.file_url'] = stored ? stored.url : '';
      head = ensureColumns(sh, ['A7.file_name', 'A7.file_url']);
    }
    sh.getRange(row, 1, 1, head.length).setValues([head.map(function (h) { return h in rec ? rec[h] : ''; })]);
    if (req.form === 'B' && req.final) writeNominees(id, answers.json, now);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  if (req.form === 'A' && created) mail('resume', email, id, token, req.answers['A1.name']);
  if (req.final && !wasSubmitted) mail(req.form === 'A' ? 'confirm_a' : 'confirm_b', email, id, token, req.answers[req.form === 'A' ? 'A1.name' : 'B.name']);
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

function findRow(sh, id) {
  if (!/^V4[ANC]-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(String(id))) return 0;
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

/* Keeps only known key shapes, caps sizes, and neutralizes text that Sheets would read as a formula.
   flat = one sheet column per variable; json = what resume restores (includes __keywords, __cards). */
function clean(answers, keyRe) {
  var flat = {}, json = {}, n = 0;
  Object.keys(answers).forEach(function (k) {
    if (n >= MAX_KEYS) return;
    var v = answers[k];
    if (k === 'A7.file_name' || k === 'A7.file_url') return; /* server-owned columns */
    if (keyRe.test(k)) {
      if (typeof v === 'boolean') { flat[k] = v; json[k] = v; n++; }
      else if (typeof v === 'string' || typeof v === 'number') { var s = String(v).slice(0, MAX_VALUE); flat[k] = cellText(s); json[k] = s; n++; }
    } else if (k === '__keywords' && Array.isArray(answers[k])) {
      json[k] = v.slice(0, 5).map(function (x) { return String(x).slice(0, 200); });
    } else if (k === '__cards' && Array.isArray(v)) {
      json[k] = v.slice(0, MAX_CARDS).map(function (c) {
        c = c || {};
        return { type: String(c.type || '').slice(0, 20), name: String(c.name || '').slice(0, 300), contact: String(c.contact || '').slice(0, 300), affiliation: String(c.affiliation || '').slice(0, 300), why: String(c.why || '').slice(0, 1000) };
      });
    } else if (k === '__screen' || k === '__prefilled') {
      json[k] = v;
    } else if (k === '__file' && v && typeof v === 'object') {
      /* what the client remembers about an earlier upload; the server copy is rewritten whenever a file is sent */
      json[k] = { name: String(v.name || '').slice(0, 200), size: +v.size || 0, url: /^https:\/\/(drive|docs)\.google\.com\//.test(v.url) ? v.url : '' };
    }
  });
  return { flat: flat, json: json };
}

function cellText(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function hash(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/* ---------- email ---------- */

/* Off until the organizers confirm the copy and the sender: set script property EMAIL_ENABLED=true and SITE_URL
   (the site root, for example https://kutsosp.github.io/v4air-site/). A consumer Gmail account sends to about
   100 recipients a day. */
function mail(kind, to, id, token, name) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('EMAIL_ENABLED') !== 'true') return;
  var site = (props.getProperty('SITE_URL') || '').replace(/\/?$/, '/');
  if (!/^https:\/\//.test(site)) return;
  var hello = 'Hello' + (name ? ' ' + String(name).trim() : '') + ',\n\n';
  var link = site + 'apply/?id=' + encodeURIComponent(id) + '&t=' + encodeURIComponent(token);
  var subject, body;
  if (kind === 'resume') {
    subject = 'V4 AI Researchers Meetup: your application ' + id;
    body = hello + 'Your application ID is ' + id + '. Keep it; it is in every email we send you about the meetup.\n\n' +
      'Your answers are saved as you go. To continue on any device, open this link:\n' + link + '\n';
  } else if (kind === 'confirm_a') {
    subject = 'V4 AI Researchers Meetup: application ' + id + ' received';
    body = hello + 'Thank you. Your application is in.\n\nYour application ID: ' + id + '\nKeep it; it is in every email we send you about the meetup.\n\n' +
      'Everyone hears from us by February. You can change your answers until 15 January through this link:\n' + link + '\n';
  } else {
    subject = 'V4 AI Researchers Meetup: nomination ' + id + ' received';
    body = hello + 'Thank you for your nominations.\n\nYour nomination ID: ' + id + '\nQuote it if you write to us about these nominations.\n';
  }
  if (MailApp.getRemainingDailyQuota() < 1) { console.warn('mail quota exhausted, not sent: ' + kind + ' ' + id); return; }
  MailApp.sendEmail({ to: to, subject: subject, body: body, name: 'V4 AI Researchers Meetup' });
}
