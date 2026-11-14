/* In-memory imitation of the parts of Google Sheets the two form backends use, so the real backend code can run in CI
   without credentials and without touching the real "V4AIR forms" Sheet.
   - REST (backend-worker): values.get / batchGet / update / append, spreadsheets.get (sheet properties), batchUpdate
     (appendDimension, addSheet, deleteDimension, deleteSheet), plus the OAuth token endpoint.
   - Apps Script (backend/Code.gs): SpreadsheetApp, Range.getValues/setValues and friends, built on the same store.
   Entered strings are interpreted the way Google interprets typed input (USER_ENTERED, and Apps Script setValues):
   formulas, whole and decimal numbers (leading zeros lost), TRUE/FALSE, percents and dates turn into other types unless
   the text starts with an apostrophe. That is the behaviour the backends' cellText() guards against, so a regression
   there shows up as a mismatch in the tests. */

export class Book {
  constructor() { this.tabs = new Map(); this.nextId = 1; }
  tab(title, create) {
    if (!this.tabs.has(title) && create) this.tabs.set(title, { id: this.nextId++, title, rows: [], cols: 26, frozen: 0 });
    return this.tabs.get(title);
  }
  seed(title, header, rows) { const t = this.tab(title, true); t.rows = [header.slice(), ...rows.map(r => r.slice())]; t.cols = Math.max(26, header.length); return t; }
  table(title) {
    const t = this.tab(title); if (!t || !t.rows.length) return { head: [], rows: [] };
    const head = t.rows[0].map(String);
    return { head, rows: t.rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]]))) };
  }
}

/* ---------- A1 notation ---------- */
const colNum = s => s.split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
export const colName = n => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
export function parseA1(a1) {
  const m = /^(?:'((?:[^']|'')+)'|([^!]+))!(.*)$/.exec(a1);
  if (!m) throw new Error('bad range ' + a1);
  const title = (m[1] || m[2]).replace(/''/g, "'"), ref = m[3];
  let r1 = 1, c1 = 1, r2 = Infinity, c2 = Infinity, x;
  if ((x = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(ref))) { c1 = colNum(x[1]); r1 = +x[2]; c2 = colNum(x[3]); r2 = +x[4]; }
  else if ((x = /^([A-Z]+)(\d+)$/.exec(ref))) { c1 = colNum(x[1]); r1 = +x[2]; } /* a start cell: writes run right and down from it */
  else if ((x = /^([A-Z]+):([A-Z]+)$/.exec(ref))) { c1 = colNum(x[1]); c2 = colNum(x[2]); }
  else if ((x = /^(\d+):(\d+)$/.exec(ref))) { r1 = +x[1]; r2 = +x[2]; }
  else throw new Error('bad range ' + a1);
  return { title, r1, c1, r2, c2 };
}

/* ---------- how Google reads typed input ---------- */
const EPOCH = Date.UTC(1899, 11, 30);
export const serial = d => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) - EPOCH) / 86400000;
export const fromSerial = n => { const d = new Date(Math.round(n * 86400000) + EPOCH); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()); };
export function entered(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return serial(v);
  if (typeof v !== 'string') return v;
  if (v.startsWith("'")) return v.slice(1);                                   /* forced text */
  if (v === '') return '';
  if (v.startsWith('=')) return { formula: v };                               /* would be evaluated */
  if (/^(TRUE|FALSE)$/i.test(v)) return v.toUpperCase() === 'TRUE';
  if (/^[+-]?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(v.trim())) return Number(v);     /* 0123 -> 123, 1e5 -> 100000 */
  if (/^-?\d+(\.\d+)?%$/.test(v.trim())) return Number(v.trim().slice(0, -1)) / 100;
  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(v))) return serial(new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
  if ((m = /^(\d{1,2})[./](\d{1,2})[./]?(\d{4})?$/.exec(v.trim()))) return serial(new Date(+(m[3] || 2026), +m[2] - 1, +m[1]));   /* 1/2, 12.1. */
  return v;
}

function readRange(book, a1) {
  const g = parseA1(a1), t = book.tab(g.title); if (!t) throw new Error('no tab ' + g.title);
  const r2 = Math.min(g.r2, t.rows.length), out = [];
  for (let r = g.r1; r <= r2; r++) {
    const row = t.rows[r - 1] || [], c2 = Math.min(g.c2, row.length), vals = [];
    for (let c = g.c1; c <= c2; c++) { const v = row[c - 1]; vals.push(v && typeof v === 'object' && 'formula' in v ? v.formula : v === undefined ? '' : v); }
    while (vals.length && vals[vals.length - 1] === '') vals.pop();
    out.push(vals);
  }
  while (out.length && !out[out.length - 1].length) out.pop();
  return out;
}
function writeRange(book, a1, values, raw) {
  const g = parseA1(a1), t = book.tab(g.title); if (!t) throw new Error('no tab ' + g.title);
  values.forEach((vals, i) => {
    const r = g.r1 + i; while (t.rows.length < r) t.rows.push([]);
    const row = t.rows[r - 1];
    vals.forEach((v, j) => {
      const c = g.c1 + j; if (c > t.cols) throw new Error(`exceeds grid limits: column ${c} > ${t.cols} in ${g.title}`);
      while (row.length < c) row.push('');
      row[c - 1] = raw ? (v === null || v === undefined ? '' : v) : entered(v);
    });
  });
}

/* ---------- REST handler (for the Worker's fetch) ---------- */
export function restHandler(book) {
  const ok = o => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
  return async (url, init) => {
    const u = new URL(url), method = (init && init.method) || 'GET';
    if (u.hostname === 'oauth2.googleapis.com') return ok({ access_token: 'test-token', expires_in: 3600 });
    const body = init && init.body ? JSON.parse(init.body) : null;
    const m = /^\/v4\/spreadsheets\/[^/:]+(.*)$/.exec(decodeURIComponent(u.pathname)); if (!m) throw new Error('unexpected Google call ' + url);
    const rest = m[1];
    if (rest === '' && method === 'GET') return ok({ sheets: [...book.tabs.values()].map(t => ({ properties: { sheetId: t.id, title: t.title, gridProperties: { columnCount: t.cols, rowCount: Math.max(1000, t.rows.length), frozenRowCount: t.frozen } } })) });
    if (rest === '/values:batchGet') return ok({ valueRanges: u.searchParams.getAll('ranges').map(r => ({ range: r, values: readRange(book, r) })) });
    if (rest === ':batchUpdate') {
      for (const q of body.requests) {
        if (q.appendDimension) { const t = [...book.tabs.values()].find(x => x.id === q.appendDimension.sheetId); if (q.appendDimension.dimension === 'COLUMNS') t.cols += q.appendDimension.length; }
        else if (q.addSheet) { const t = book.tab(q.addSheet.properties.title, true); const gp = q.addSheet.properties.gridProperties || {}; t.cols = gp.columnCount || 26; t.frozen = gp.frozenRowCount || 0; }
        else if (q.deleteDimension) { const rg = q.deleteDimension.range, t = [...book.tabs.values()].find(x => x.id === rg.sheetId); t.rows.splice(rg.startIndex, rg.endIndex - rg.startIndex); }
        else if (q.deleteSheet) { for (const [k, t] of book.tabs) if (t.id === q.deleteSheet.sheetId) book.tabs.delete(k); }
        else throw new Error('unsupported batchUpdate ' + JSON.stringify(q));
      }
      return ok({ replies: [] });
    }
    const v = /^\/values\/(.+?)(:append)?$/.exec(rest); if (!v) throw new Error('unexpected Google call ' + url);
    const raw = u.searchParams.get('valueInputOption') === 'RAW';
    if (v[2]) {
      const g = parseA1(v[1]), t = book.tab(g.title), start = t.rows.length + 1;
      writeRange(book, `'${g.title.replace(/'/g, "''")}'!A${start}`, body.values, raw);
      return ok({ updates: { updatedRange: `'${g.title}'!A${start}:${colName(Math.max(1, ...body.values.map(r => r.length)))}${start + body.values.length - 1}` } });
    }
    if (method === 'PUT') { writeRange(book, v[1], body.values, raw); return ok({}); }
    return ok({ range: v[1], values: readRange(book, v[1]) });
  };
}

/* ---------- Apps Script services (for Code.gs) ---------- */
export function appsScript(book, opts) {
  const DATES = ['started_at', 'last_saved_at', 'submitted_at', 'confirm_sent_at', 'resume_sent_at', 'saved_at'];
  class Rng {
    constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
    a1() { return `'${this.sh.t.title.replace(/'/g, "''")}'!${colName(this.c)}${this.r}:${colName(this.c + this.nc - 1)}${this.r + this.nr - 1}`; }
    getValues() {
      const head = (this.sh.t.rows[0] || []).map(String), vals = readRange(book, this.a1()), out = [];
      for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) { let x = (vals[i] || [])[j]; if (x === undefined) x = ''; if (typeof x === 'number' && DATES.includes(head[this.c - 1 + j])) x = fromSerial(x); row.push(x); } out.push(row); }
      return out;
    }
    setValues(v) { writeRange(book, this.a1(), v, false); return this; }
    setValue(v) { return this.setValues([[v]]); }
    getRow() { return this.r; }
    createTextFinder(text) { const self = this; return { matchEntireCell() { return this; }, findNext() { const i = self.getValues().findIndex(r => r.includes(text)); return i < 0 ? null : new Rng(self.sh, self.r + i, self.c, 1, 1); } }; }
  }
  class Sh {
    constructor(t) { this.t = t; }
    getName() { return this.t.title; }
    getLastRow() { let n = this.t.rows.length; while (n && !(this.t.rows[n - 1] || []).some(x => x !== '')) n--; return n; }
    getLastColumn() { return (this.t.rows[0] || []).length; }
    getMaxColumns() { return this.t.cols; }
    insertColumnsAfter(_, n) { this.t.cols += n; }
    getRange(r, c, nr, nc) { return new Rng(this, r, c, nr || 1, nc || 1); }
    setFrozenRows(n) { this.t.frozen = n; } setFrozenColumns() {}
    deleteRow(r) { this.t.rows.splice(r - 1, 1); }
  }
  const ss = {
    getSheets: () => [...book.tabs.values()].map(t => new Sh(t)),
    getSheetByName: n => (book.tab(n) ? new Sh(book.tab(n)) : null),
    insertSheet: n => new Sh(book.tab(n, true)),
    deleteSheet: s => book.tabs.delete(s.t.title)
  };
  const iter = a => { let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; };
  const props = Object.assign({ EMAIL_ENABLED: 'false', SITE_URL: 'https://v4air.eu/' }, (opts && opts.props) || {});
  return {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} },
    DriveApp: { getFoldersByName: () => iter([]), createFolder() { throw new Error('Drive is not imitated: file uploads are not part of these tests'); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    MailApp: { getRemainingDailyQuota: () => 0 },
    GmailApp: { getAliases: () => [], sendEmail() { throw new Error('no mail in tests'); } },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased() { return this; }, everyMinutes() { return this; }, create() {} }) }
  };
}
