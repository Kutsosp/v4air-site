/* V4AIR forms backend, fast path: a Cloudflare Worker writing to the same "V4AIR forms" Google Sheet as backend/Code.gs.
   Handles load and save (autosave, submit, nominations). File uploads (A7) stay on Apps Script, because a service
   account has no Drive storage of its own; public/forms-api.js routes requests with a file there.
   Same sheet layout, same ids, same token hashes as Code.gs, so either backend can read what the other wrote.
   Secret: GOOGLE_SA_KEY (service-account JSON, editor on the sheet). Vars: SHEET_ID, ALLOWED_ORIGINS. */

const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const FORMS = {
  A: { tab: 'Applications', prefix: 'V4A', keyRe: /^A[1-8]\.[A-Za-z0-9_.]+$/ },
  B: { tab: 'Nominations', prefix: 'V4N', keyRe: /^B\.[A-Za-z0-9_.]+$/ }
};
const MAX_BODY = 2000000, MAX_VALUE = 12000, MAX_KEYS = 800, MAX_CARDS = 9;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API = 'https://sheets.googleapis.com/v4/spreadsheets/';

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET') return json({ ok: true, service: 'v4air-forms-worker' }, cors);
    if (request.method !== 'POST') return json({ ok: false, error: 'bad_method' }, cors, 405);
    try {
      const body = await request.text();
      if (body.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, cors);
      const req = JSON.parse(body);
      if (req.hp) return json({ ok: true, id: 'V4X-0000-0000', token: '' }, cors); /* honeypot */
      if (req.file || req.removeFile) return json({ ok: false, error: 'use_gas' }, cors); /* uploads go to Apps Script */
      const g = new Sheets(env);
      if (req.action === 'load') return json(await load(g, req), cors);
      if (req.action === 'save') return json(await save(g, req), cors);
      return json({ ok: false, error: 'bad_action' }, cors);
    } catch (err) {
      console.error(err && err.stack || String(err));
      return json({ ok: false, error: 'server' }, cors);
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function json(obj, headers, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });
}

/* ---------- actions ---------- */

async function load(g, req) {
  const f = FORMS[req.form];
  if (!f || !req.id || !req.token) return { ok: false, error: 'bad_request' };
  const { head, ids } = await g.headAndIds(f.tab);
  const row = rowOf(ids, req.id);
  if (!row) return { ok: false, error: 'not_found' };
  const rec = await g.readRow(f.tab, row, head);
  if (rec.token_hash !== await hash(req.token)) return { ok: false, error: 'not_found' };
  return { ok: true, id: req.id, status: rec.status, answers: JSON.parse(rec.answers_json || '{}') };
}

async function save(g, req) {
  const f = FORMS[req.form];
  if (!f || !req.answers || typeof req.answers !== 'object') return { ok: false, error: 'bad_request' };
  const answers = clean(req.answers, f.keyRe);
  const email = String(req.answers[req.form === 'A' ? 'A1.email' : 'B.email'] || '').trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'email' };

  const now = pragueNow();
  /* header plus the first META columns of every row in one call; a save needs no other read */
  let { head, ids, meta } = await g.headAndIds(f.tab, 6);
  let id = req.id, token = req.token, row = id ? rowOf(ids, id) : 0, created = false;
  const set = {}; /* only the cells this save changes; every other cell in the row is left as it is */
  let old = {};
  if (row) {
    const r = meta[row - 1] || [];
    head.slice(0, 6).forEach((h, i) => { old[h] = r[i] === undefined ? '' : r[i]; });
    if (!token || old.token_hash !== await hash(token)) return { ok: false, error: 'not_found' };
  } else {
    /* no record yet, or a stale id the sheet doesn't know: start a new record */
    id = newId(f.prefix);
    token = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
    created = true;
    Object.assign(set, { response_id: id, token_hash: await hash(token), started_at: now, status: 'in progress' });
  }
  set.last_saved_at = now;
  set.screen = typeof req.answers.__screen === 'number' ? req.answers.__screen : '';
  set.answers_json = JSON.stringify(answers.json);
  if (typeof req.ga_cid === 'string' && /^[0-9.]{1,40}$/.test(req.ga_cid)) set.ga_client_id = "'" + req.ga_cid; /* text, or Sheets rounds it as a number */
  if (req.final) { set.status = 'submitted'; if (!old.submitted_at) set.submitted_at = now; }
  Object.assign(set, answers.flat);

  head = await g.addColumns(f.tab, head, Object.keys(set));
  const values = head.map(h => (h in set ? set[h] : null)); /* null = leave the cell untouched */
  if (created) row = await g.appendRow(f.tab, values.map(v => (v === null ? '' : v)));
  else await g.writeRow(f.tab, row, values);
  if (req.form === 'B' && req.final) await writeNominees(g, id, answers.json, now);

  const out = { ok: true, id, token, created };
  if ('__file' in answers.json) out.file = answers.json.__file;
  return out;
}

async function writeNominees(g, nominationId, j, now) {
  const tab = 'Nominees';
  const ids = await g.column(tab);
  const del = [];
  ids.forEach((v, i) => { if (i > 0 && v === nominationId) del.push(i); }); /* resubmission replaces this nomination's rows */
  if (del.length) await g.deleteRows(tab, del);
  const rows = (j.__cards || []).map((c, i) =>
    [nominationId, j['B.application_id'] || '', j['B.name'] || '', j['B.email'] || '', i + 1, c.type, c.name, c.contact, c.affiliation, c.why]
      .map(v => (typeof v === 'string' ? cellText(v) : v)).concat([now]));
  if (rows.length) await g.append(tab, rows);
}

/* ---------- input hygiene (same rules as Code.gs clean) ---------- */

function clean(answers, keyRe) {
  const flat = {}, out = {};
  let n = 0;
  Object.keys(answers).forEach(k => {
    if (n >= MAX_KEYS) return;
    const v = answers[k];
    if (k === 'A7.file_name' || k === 'A7.file_url') return; /* server-owned columns */
    if (keyRe.test(k)) {
      if (typeof v === 'boolean') { flat[k] = v; out[k] = v; n++; }
      else if (typeof v === 'string' || typeof v === 'number') { const s = String(v).slice(0, MAX_VALUE); flat[k] = cellText(s); out[k] = s; n++; }
    } else if (k === '__keywords' && Array.isArray(v)) {
      out[k] = v.slice(0, 5).map(x => String(x).slice(0, 200));
    } else if (k === '__cards' && Array.isArray(v)) {
      out[k] = v.slice(0, MAX_CARDS).map(c => {
        c = c || {};
        return { type: String(c.type || '').slice(0, 20), name: String(c.name || '').slice(0, 300), contact: String(c.contact || '').slice(0, 300), affiliation: String(c.affiliation || '').slice(0, 300), why: String(c.why || '').slice(0, 1000) };
      });
    } else if (k === '__screen' || k === '__prefilled') {
      out[k] = v;
    } else if (k === '__file' && v && typeof v === 'object') {
      out[k] = { name: String(v.name || '').slice(0, 200), size: +v.size || 0, url: /^https:\/\/(drive|docs)\.google\.com\//.test(v.url) ? v.url : '' };
    }
  });
  return { flat, json: out };
}
function cellText(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }
async function hash(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function newId(prefix) {
  const r = crypto.getRandomValues(new Uint8Array(8));
  let out = '';
  for (let i = 0; i < 8; i++) { out += ID_ALPHABET[r[i] % 32]; if (i === 3) out += '-'; }
  return prefix + '-' + out;
}
function rowOf(ids, id) {
  if (!/^V4[ANC]-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(String(id))) return 0;
  const i = ids.indexOf(id);
  return i >= 1 ? i + 1 : 0; /* 1-based sheet row */
}
/* "2026-10-06 15:04:05" in Prague time; written with USER_ENTERED, so Sheets stores it as a date like Code.gs does */
function pragueNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}
function colName(n) { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; }
function q(tab) { return "'" + tab.replace(/'/g, "''") + "'"; }

/* ---------- Google Sheets client (service account, token cached per isolate) ---------- */

let cachedToken = null, cachedExp = 0, sheetMeta = null;

export class Sheets {
  constructor(env) { this.env = env; this.base = API + env.SHEET_ID; }

  async token() {
    if (cachedToken && Date.now() < cachedExp - 60000) return cachedToken;
    const key = JSON.parse(this.env.GOOGLE_SA_KEY);
    const now = Math.floor(Date.now() / 1000);
    const enc = o => b64url(new TextEncoder().encode(JSON.stringify(o)));
    const unsigned = enc({ alg: 'RS256', typ: 'JWT' }) + '.' + enc({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const der = Uint8Array.from(atob(key.private_key.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
    const k = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, new TextEncoder().encode(unsigned));
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + unsigned + '.' + b64url(new Uint8Array(sig)) });
    const j = await r.json();
    if (!j.access_token) throw new Error('token: ' + JSON.stringify(j));
    cachedToken = j.access_token; cachedExp = Date.now() + j.expires_in * 1000;
    return cachedToken;
  }

  async call(path, init) {
    init = init || {};
    const r = await fetch(this.base + path, Object.assign({}, init, { headers: { Authorization: 'Bearer ' + await this.token(), 'Content-Type': 'application/json' } }));
    const j = await r.json();
    if (!r.ok) throw new Error('sheets ' + r.status + ': ' + JSON.stringify(j).slice(0, 300));
    return j;
  }

  /* header row plus the first `cols` columns of every row, in one request */
  async headAndIds(tab, cols) {
    const j = await this.call('/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&ranges=' + encodeURIComponent(q(tab) + '!1:1') + '&ranges=' + encodeURIComponent(q(tab) + '!A:' + colName(cols || 1)));
    const head = ((j.valueRanges[0].values || [])[0] || []).map(String);
    const meta = j.valueRanges[1].values || [];
    const ids = meta.map(r => String(r[0] || ''));
    if (!head.length) throw new Error('missing tab or header: ' + tab);
    return { head, ids, meta };
  }

  async column(tab) {
    const j = await this.call('/values/' + encodeURIComponent(q(tab) + '!A:A') + '?valueRenderOption=UNFORMATTED_VALUE');
    return (j.values || []).map(r => String(r[0] || ''));
  }

  async readRow(tab, row, head) {
    const j = await this.call('/values/' + encodeURIComponent(q(tab) + '!A' + row + ':' + colName(head.length) + row) + '?valueRenderOption=UNFORMATTED_VALUE');
    const vals = (j.values || [])[0] || [], o = {};
    head.forEach((h, i) => { o[h] = vals[i] === undefined ? '' : vals[i]; });
    return o;
  }

  async writeRow(tab, row, values) {
    await this.call('/values/' + encodeURIComponent(q(tab) + '!A' + row) + '?valueInputOption=USER_ENTERED', { method: 'PUT', body: JSON.stringify({ values: [values] }) });
  }

  /* appends atomically and returns the 1-based row it landed in */
  async appendRow(tab, values) {
    const j = await this.call('/values/' + encodeURIComponent(q(tab) + '!A1') + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', { method: 'POST', body: JSON.stringify({ values: [values] }) });
    return +/![A-Z]+(\d+)/.exec(j.updates.updatedRange)[1];
  }

  async append(tab, rows) {
    await this.call('/values/' + encodeURIComponent(q(tab) + '!A1') + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', { method: 'POST', body: JSON.stringify({ values: rows }) });
  }

  async meta(force) {
    if (!sheetMeta || force) {
      const j = await this.call('?fields=sheets.properties(sheetId,title,gridProperties.columnCount)');
      sheetMeta = {};
      j.sheets.forEach(s => { sheetMeta[s.properties.title] = { id: s.properties.sheetId, cols: s.properties.gridProperties.columnCount }; });
    }
    return sheetMeta;
  }

  /* header cells for keys the sheet doesn't have yet, appended on the right like Code.gs ensureColumns */
  async addColumns(tab, head, keys) {
    const missing = keys.filter(k => head.indexOf(k) === -1);
    if (!missing.length) return head;
    const m = (await this.meta(true))[tab];
    const need = head.length + missing.length - m.cols;
    if (need > 0) await this.call(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ appendDimension: { sheetId: m.id, dimension: 'COLUMNS', length: need } }] }) });
    await this.call('/values/' + encodeURIComponent(q(tab) + '!' + colName(head.length + 1) + '1') + '?valueInputOption=RAW', { method: 'PUT', body: JSON.stringify({ values: [missing] }) });
    return head.concat(missing);
  }

  async deleteRows(tab, zeroBasedRows) {
    const id = (await this.meta())[tab].id;
    const requests = zeroBasedRows.sort((a, b) => b - a).map(i => ({ deleteDimension: { range: { sheetId: id, dimension: 'ROWS', startIndex: i, endIndex: i + 1 } } }));
    await this.call(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests }) });
  }
}

function b64url(bytes) {
  let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
