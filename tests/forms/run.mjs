/* Forms data test: fills the real application and nomination forms in Chrome and proves every answer lands in the right
   Sheet column, through both real backends (backend-worker = the fast path, backend/Code.gs = the fallback), without
   touching the real Sheet. Google is imitated in memory (fake-google.mjs), seeded with the live header rows and synthetic
   old rows, so the test also proves that a form change keeps every existing column and row as it was.

   Checks per submitted form:
     1. exactly one row with the form's ID, status "submitted", meta columns filled;
     2. every field on the page (text, ticks, choices, hidden fields included) equals the cell in the column of the same
        name, and answers_json holds the same values; a field the backend drops (bad name) fails the test;
     3. answers that Sheets would misread (formulas, 0123, 1/2, 50 %, TRUE, dates) stay exactly as typed;
   and after all scenarios:
     4. the seeded header is unchanged and in the same order (new columns only on the right), no header appears twice;
     5. the seeded old rows are unchanged, cell by cell.
   Run: cd tests/forms && npm install && npx playwright install chromium && node run.mjs   (CHROME=path uses a local Chrome)
   Writes a Markdown summary to $GITHUB_STEP_SUMMARY when it runs in GitHub Actions. */
import { readFileSync, existsSync, appendFileSync, statSync } from 'node:fs';
import { createHash, randomUUID, generateKeyPairSync, createHmac } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from 'playwright';
import { Book, restHandler, appsScript } from './fake-google.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const PUB = path.join(ROOT, 'public');
const P = { site: 4310, worker: 4311, gas: 4312 };
const SITE = `http://127.0.0.1:${P.site}`;
const HEAD = JSON.parse(readFileSync(new URL('./fixtures/sheet-headers.json', import.meta.url)));

/* ---------- the imitated Sheet, seeded with the live headers and two synthetic old rows ---------- */
const book = new Book();
const oldRow = (head, n) => head.map((h, i) => (h === 'response_id' ? `V4A-SEED-000${n}` : h === 'status' ? 'submitted' : /_at$/.test(h) ? 46300 + n : h === 'answers_json' ? '{}' : i % 3 === 0 ? true : `old answer ${n}.${i}`));
const SEED = { Applications: [oldRow(HEAD.Applications, 1), oldRow(HEAD.Applications, 2)], Nominations: [], Nominees: [] };
for (const t of ['Applications', 'Nominations', 'Nominees']) book.seed(t, HEAD[t], SEED[t]);
const seeded = JSON.parse(JSON.stringify(Object.fromEntries([...book.tabs].map(([k, t]) => [k, t.rows]))));

/* ---------- backend 1: the real Worker, its Google calls answered by the imitation ---------- */
const google = restHandler(book), realFetch = globalThis.fetch;
globalThis.fetch = (u, i) => (/^https:\/\/(sheets|oauth2)\.googleapis\.com\//.test(String(u)) ? google(String(u), i) : realFetch(u, i));
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const workerEnv = { SHEET_ID: 'test-sheet', ALLOWED_ORIGINS: SITE, UNSUB_SECRET: 'test-secret', GOOGLE_SA_KEY: JSON.stringify({ client_email: 'ci@test', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }) };
const worker = (await import(path.join(ROOT, 'backend-worker/src/index.js'))).default;
const body = req => new Promise(ok => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });
const calls = { worker: 0, gas: 0 };
http.createServer(async (req, res) => {
  const b = await body(req); if (req.method === 'POST') calls.worker++;
  const r = await worker.fetch(new Request('http://127.0.0.1' + req.url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? b : undefined }), workerEnv);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
}).listen(P.worker, '127.0.0.1');

/* ---------- backend 2: the real Code.gs on imitated Apps Script services ---------- */
const sha = (alg, s) => [...createHash(alg).update(s, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b));
const ctx = vm.createContext(Object.assign(appsScript(book), {
  console,
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: () => randomUUID(),
    computeDigest: (a, s) => sha(a, s), base64Decode: s => Buffer.from(s, 'base64'), newBlob: (bytes, type, name) => ({ bytes, type, name }),
    base64EncodeWebSafe: x => Buffer.from(Array.isArray(x) ? x.map(b => b & 255) : x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    computeHmacSha256Signature: (v, k) => [...createHmac('sha256', k).update(v).digest()].map(b => (b > 127 ? b - 256 : b)),
    formatDate: d => new Date(d).toISOString()
  }
}));
vm.runInContext(readFileSync(path.join(ROOT, 'backend/Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
http.createServer(async (req, res) => {
  const b = await body(req), send = (code, s) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(s); };
  try {
    if (req.method !== 'POST') return send(200, JSON.stringify({ ok: true }));
    calls.gas++;
    send(200, ctx.doPost({ postData: { contents: b.toString('utf8') } }).s);
  } catch (e) { console.error(e); send(500, String(e)); }
}).listen(P.gas, '127.0.0.1');

/* ---------- the site from public/, with forms-api.js pointed at the two local backends ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, SITE).pathname);
  let f = path.join(PUB, p); if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  let data = readFileSync(f);
  if (p === '/forms-api.js') {
    let s = data.toString('utf8');
    const before = s;
    s = s.replace(/var URL = '[^']*';/, `var URL = 'http://127.0.0.1:${P.gas}/exec';`).replace(/var WORKER = '[^']*';/, `var WORKER = 'http://127.0.0.1:${P.worker}';`);
    if (s === before) throw new Error('forms-api.js: could not point URL and WORKER at the test backends');
    data = Buffer.from(s);
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data);
}).listen(P.site, '127.0.0.1');

/* ---------- the browser side: answer everything visible, like a person ---------- */
const LIST = () => {
  const s = document.querySelector('.screen.active') || document.querySelector('form'); let n = window.__ti || 0; const out = [];
  s.querySelectorAll('input,select,textarea').forEach(el => {
    if (el.type === 'hidden' || el.type === 'file' || el.id === 'hp' || el.disabled) return;
    if (!(el.offsetParent !== null || (el.closest('label') && el.closest('label').offsetParent !== null))) return;
    if (!el.dataset.ti) el.dataset.ti = ++n;
    out.push({ ti: el.dataset.ti, name: el.name || '', id: el.id || '', type: el.type, tag: el.tagName, cls: el.className || '', value: el.value });
  });
  window.__ti = n; return out;
};
const DOM_STATE = sel => {
  const f = document.querySelector(sel), o = {};
  f.querySelectorAll('input,select,textarea').forEach(el => {
    if (!el.name || el.id === 'hp' || el.type === 'file') return;
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ''; }
    else o[el.name] = el.value;
  });
  return o;
};
const SKIP_TICK = new Set(['A3.none']); /* "I don't use AI yet" skips the method screens; ticked only when a scenario asks */
const text = (name, kind) => (kind === 'url' ? 'https://example.com/test/' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `TEST ${name} Příliš žluťoučký kůň 😀 "q" <b>&amp;` + (kind === 'textarea' ? '\nsecond line' : ''));
async function fillScreen(page, over) {
  const touched = new Set();
  for (let round = 0; round < 14; round++) {
    const todo = (await page.evaluate(LIST)).filter(c => !touched.has(c.name || c.id)); if (!todo.length) return;
    const groups = new Set();
    for (const c of todo) {
      const key = c.name || c.id; if (touched.has(key) || groups.has(key)) continue;
      if (/(^| )(hw-no|help-none)( |$)/.test(c.cls) || key === 'kw-input' || key === 'theme-switch' || key === 'A1.orcid' || (SKIP_TICK.has(key) && over[key] !== true)) { touched.add(key); continue; }
      const loc = page.locator(`[data-ti="${c.ti}"]`);
      if (c.type === 'radio') { groups.add(key); const vals = todo.filter(x => x.name === key).map(x => x.value); const want = key in over ? over[key] : vals[vals.length - 1]; await page.locator(`[name="${key}"][value="${want}"]`).evaluate(e => { if (!e.checked) e.click(); }); }
      else if (c.type === 'checkbox') { if (over[key] !== false) await loc.evaluate(e => { if (!e.checked && !e.disabled) e.click(); }); }
      else if (c.tag === 'SELECT') { const opts = await loc.evaluate(e => [...e.options].map(o => o.value).filter(Boolean)); await loc.selectOption(key in over ? over[key] : opts[opts.length - 1]); }
      else await loc.fill(String(key in over ? over[key] : text(key, c.type === 'url' ? 'url' : c.tag === 'TEXTAREA' ? 'textarea' : 'text')));
      touched.add(key);
    }
  }
}
const active = page => page.evaluate(() => (document.querySelector('.screen.active') || {}).dataset ? document.querySelector('.screen.active').dataset.key : '');
async function next(page) {
  const k = await active(page);
  await page.locator('#btn-next').click();
  await page.waitForFunction(k => { const a = document.querySelector('.screen.active'); const e = document.querySelector('#err-summary.on'); return (a && a.dataset.key !== k) || !!e; }, k, { timeout: 60000 });
  const err = await page.evaluate(() => { const e = document.querySelector('#err-summary.on'); return e ? e.innerText : ''; });
  if (err) throw new Error(`screen ${k} did not advance: ${err.replace(/\s+/g, ' ')}`);
}

async function application(browser, name, over, opts = {}) {
  const c = await browser.newContext(), page = await c.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('dialog', d => d.accept());
  await c.route('**/*', r => {
    const u = r.request().url();
    if (opts.blockWorker && u.startsWith(`http://127.0.0.1:${P.worker}`)) return r.abort();
    return u.startsWith('http://127.0.0.1') ? r.continue() : r.abort();
  });
  await page.goto(SITE + '/apply/'); await page.locator('.screen.active [data-next]').first().click();
  for (let i = 0; i < 25; i++) {
    const k = await active(page);
    await fillScreen(page, over);
    if (k === 'a2') for (const kw of ['alpha', 'beta 2', 'gamma']) { await page.locator('#kw-input').fill(kw); await page.locator('#kw-input').press('Enter'); } /* the way the hint says: Enter after each */
    if (k === 'a8') {
      const dom = await page.evaluate(DOM_STATE, '#form');
      await next(page);
      const id = await page.evaluate(() => JSON.parse(localStorage.getItem('v4air-form-a-live-v1') || '{}').__id);
      await c.close(); return { name, form: 'A', tab: 'Applications', id, dom, errors };
    }
    await next(page);
  }
  throw new Error('never reached the last screen');
}
const CARDS = [
  { type: 'student', name: 'CI Student Nominee', contact: 'ci-student@example.com', affiliation: '=1+1 Faculty', why: '0123 works on bees' },
  { type: 'outside', name: 'CI Outside Nominee', contact: '+420 723 953 755', affiliation: 'TEST Startup', why: 'Builds detectors' }];
async function nomination(browser, name, over) {
  const c = await browser.newContext(), page = await c.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await c.route('**/*', r => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
  await page.goto(SITE + '/nominate/'); await page.locator('.screen.active [data-next]').first().click();
  await page.locator('#B\\.name').fill(over['B.name']); await page.locator('#B\\.email').fill(over['B.email']); await page.locator('#B\\.institution').fill('TEST Přírodovědecká fakulta');
  await next(page);
  for (const [i, card] of CARDS.entries()) {
    const n = i + 1;
    if (i) await page.locator('#add-card').click();
    await page.locator(`[name="type${n}"][value="${card.type}"]`).evaluate(e => e.click());
    await page.locator(`#c${n}-name`).fill(card.name); await page.locator(`#c${n}-contact`).fill(card.contact);
    await page.locator(`#c${n}-aff`).fill(card.affiliation); await page.locator(`#c${n}-why`).fill(card.why);
  }
  await next(page);
  await page.locator('[name="B.consent"]').evaluate(e => { if (!e.checked) e.click(); });
  const dom = await page.evaluate(DOM_STATE, '#form'); await next(page);
  const id = (await page.locator('#end-id').innerText()).trim(); /* the nomination page clears its storage after sending */
  await c.close();
  return { name, form: 'B', tab: 'Nominations', id, dom, errors, nominator: over };
}
function checkNominees(run) {
  const got = book.table('Nominees').rows.filter(r => r.nomination_id === run.id).sort((a, b) => a.n - b.n), bad = [];
  if (got.length !== CARDS.length) return [`expected ${CARDS.length} Nominees rows, found ${got.length}`];
  got.forEach((r, i) => {
    for (const [k, v] of Object.entries(CARDS[i])) if (String(r[k]) !== v) bad.push(`nominee ${i + 1}.${k}: typed ${JSON.stringify(v)}, Sheet has ${JSON.stringify(r[k])}`);
    if (r.nominator_name !== run.nominator['B.name'] || r.nominator_email !== run.nominator['B.email'] || r.n !== i + 1) bad.push(`nominee ${i + 1}: nominator columns wrong`);
  });
  return bad;
}

/* ---------- checks ---------- */
function check(run) {
  const bad = [], { head, rows } = book.table(run.tab), hits = rows.filter(r => r.response_id === run.id);
  if (!run.id) bad.push('the page never got an ID back from the backend');
  if (hits.length !== 1) { bad.push(`expected 1 row for ${run.id}, found ${hits.length}`); return bad; }
  const row = hits[0];
  if (row.status !== 'submitted') bad.push(`status is "${row.status}", expected "submitted"`);
  for (const m of ['token_hash', 'started_at', 'last_saved_at', 'submitted_at']) if (row[m] === '' || row[m] === undefined) bad.push(`meta column ${m} is empty`);
  let json = {}; try { json = JSON.parse(row.answers_json || '{}'); } catch (e) { bad.push('answers_json is not JSON'); }
  const keyRe = run.form === 'A' ? /^A[1-8]\./ : /^B\./;
  let n = 0;
  const NOT_DATA = new Set(['website', 'theme-switch']); /* honeypot and page controls, never stored */
  for (const [k, want] of Object.entries(run.dom)) {
    if (NOT_DATA.has(k) || /^(type\d+|c\d+-)/.test(k)) continue; /* nomination cards travel as __cards, checked in Nominees */
    if (!keyRe.test(k)) { bad.push(`${k}: field name the backend does not accept, so it is never stored`); continue; }
    n++;
    if (!head.includes(k)) { bad.push(`${k}: no column in the Sheet (the backend dropped it)`); continue; }
    const got = row[k];
    const same = typeof want === 'boolean' ? got === want : String(got) === String(want);
    if (!same) bad.push(`${k}: page has ${JSON.stringify(want)}, Sheet cell has ${JSON.stringify(got)}`);
    if (typeof got === 'object' && got && 'formula' in got) bad.push(`${k}: stored as a live formula`);
    if (k in json && String(json[k]) !== String(want)) bad.push(`${k}: answers_json has ${JSON.stringify(json[k])}`);
  }
  run.fields = n;
  if (run.errors.length) bad.push('page errors: ' + run.errors.join('; '));
  return bad;
}
function integrity() {
  const bad = [], added = {};
  for (const [tab, rows0] of Object.entries(seeded)) {
    const rows = book.tab(tab).rows, h0 = rows0[0] || [], h = rows[0] || [];
    h0.forEach((name, i) => { if (h[i] !== name) bad.push(`${tab}: column ${i + 1} was "${name}", is now "${h[i]}"`); });
    const dup = h.filter((x, i) => h.indexOf(x) !== i); if (dup.length) bad.push(`${tab}: duplicate columns ${dup.join(', ')}`);
    rows0.slice(1).forEach((r, i) => r.forEach((v, j) => { if (JSON.stringify(rows[i + 1][j]) !== JSON.stringify(v)) bad.push(`${tab}: old row ${i + 1}, column "${h0[j]}" changed from ${JSON.stringify(v)} to ${JSON.stringify(rows[i + 1][j])}`); }));
    added[tab] = h.slice(h0.length);
  }
  return { bad, added };
}

/* ---------- scenarios ---------- */
const BASE = { 'A1.email': 'ci-test@example.com', 'A1.country': 'Czechia', 'A1.stage': 'phd', 'A1.institution_key': 'cuni', 'A1.days_all': 'yes', 'A8.own_funding': 'yes', 'A8.own_funding_scope': 'part' };
const HOSTILE = { 'A1.department': '=1+1', 'A1.field': '0123', 'A1.programme': '1/2', 'A1.link_1': '50%', 'A1.link_2': 'TRUE', 'A1.link_3': '1,5', 'A1.link_4': '2026-11-04', 'A1.days_all': 'not_sure', 'A1.days_note': '12.1.',
  'A6.useful_other': '=IMPORTXML("https://example.com","//a")', 'A6.collab_kind': '1.5', 'A8.source_other': "'quoted", 'A8.questions': '@handle', 'A7.roles_other': '-5', 'A8.source_open.other_txt': '1e5' };
const exe = process.env.CHROME || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe, headless: true } : { headless: true });
const results = [];
async function scenario(label, fn) {
  const t0 = Date.now();
  try { const run = await fn(); const bad = check(run); results.push({ label, id: run.id, fields: run.fields, bad, s: (Date.now() - t0) / 1000 }); }
  catch (e) { results.push({ label, bad: [String(e && e.message || e)], s: (Date.now() - t0) / 1000 }); }
  const r = results[results.length - 1]; console.log((r.bad.length ? 'FAIL ' : 'PASS ') + label + (r.id ? ` ${r.id}, ${r.fields} fields` : '') + (r.bad.length ? '\n  - ' + r.bad.slice(0, 12).join('\n  - ') : ''));
}
const w0 = () => calls.worker, g0 = () => calls.gas;
let w, g;
w = w0(); await scenario('Application, partner PhD, every visible answer, Worker', () => application(browser, 'full', { ...BASE, 'A1.name': 'CI Full' }));
if (calls.worker === w) results[results.length - 1].bad.push('the Worker was never called');
g = g0(); await scenario('Application, Worker down, Apps Script fallback', () => application(browser, 'fallback', { ...BASE, 'A1.name': 'CI Fallback', 'A1.email': 'ci-fallback@example.com' }, { blockWorker: true }));
if (calls.gas === g) results[results.length - 1].bad.push('Apps Script was never called');
await scenario('Application, answers Sheets could misread', () => application(browser, 'hostile', { ...BASE, ...HOSTILE, 'A1.name': 'CI Hostile', 'A1.email': 'ci-hostile@example.com' }));
await scenario('Application, senior outside the partners, no AI yet', () => application(browser, 'outside', { 'A1.name': 'CI Outside', 'A1.email': 'ci-outside@example.com', 'A1.country': 'Germany', 'A1.stage': 'senior', 'A3.none': true, 'A1.days_all': 'yes' }));
await scenario('Nomination, Worker', () => nomination(browser, 'nominate', { 'B.name': 'CI Nominator', 'B.email': 'ci-nominator@example.com', 'B.application_id': '' }));
const nomRun = results[results.length - 1];
if (nomRun.id) nomRun.bad.push(...checkNominees({ id: nomRun.id, nominator: { 'B.name': 'CI Nominator', 'B.email': 'ci-nominator@example.com' } }));
await browser.close();
const integ = integrity();
results.push({ label: 'Existing columns and old rows unchanged', bad: integ.bad });
console.log((integ.bad.length ? 'FAIL ' : 'PASS ') + 'Existing columns and old rows unchanged' + (integ.bad.length ? '\n  - ' + integ.bad.slice(0, 12).join('\n  - ') : ''));
for (const [t, cols] of Object.entries(integ.added)) if (cols.length) console.log(`new columns in ${t}: ${cols.join(', ')}`);

const failed = results.filter(r => r.bad.length);
if (process.env.GITHUB_STEP_SUMMARY) {
  let md = `## Forms data test: ${failed.length ? '❌ ' + failed.length + ' failed' : '✅ all passed'}\n\nThe real forms were filled in Chrome and sent through the real backends to an imitation of the Sheet (the real Sheet was not touched).\n\n| Check | Result | Details |\n|---|---|---|\n`;
  for (const r of results) md += `| ${r.label} | ${r.bad.length ? '❌ failed' : '✅ passed'} | ${r.bad.length ? r.bad.slice(0, 5).map(x => x.replace(/\|/g, '\\|')).join('<br>') : (r.fields ? r.fields + ' fields compared' : '')} |\n`;
  const add = Object.entries(integ.added).filter(([, c]) => c.length);
  md += add.length ? `\n**New columns this change adds** (they appear on the right of the Sheet on the first real save):\n\n${add.map(([t, c]) => `- ${t}: ${c.map(x => '`' + x + '`').join(', ')}`).join('\n')}\n` : '\nNo new columns.\n';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
console.log(failed.length ? `\n${failed.length} check(s) failed` : '\nall checks passed');
process.exit(failed.length ? 1 : 0);
