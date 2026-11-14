/* Live form check: the real forms on https://v4air.eu send test answers through the real backends to the real forms
   Sheet; the test reads the rows back, compares them with what the page held, and deletes them again.
   It proves what the imitated Sheet in forms/run.mjs cannot: the deployed site, Worker and Apps Script versions, the
   service account's access and the real Sheet's columns all work together.

   Modes (LIVE_MODE):
     full   (after every deploy): application through the Worker, application with the Worker blocked (Apps Script
            fallback), nomination with two nominees;
     simple (nightly): one application through the Worker.
   Before sending, it waits until the live /apply/ and /nominate/ have the same fields as this checkout (a deploy takes a
   few minutes to go live), at most LIVE_WAIT_MIN minutes (default 20).
   Test rows carry the address v4air-test-live-<run>-<tag>@example.com. Cleanup always runs, also after a failure, and
   deletes every row with such an address in Applications, Nominations and Nominees (leftovers of older runs too); the
   backends never email @example.* addresses. The tab "Mail preview" is rewritten by every mail run, so it is left alone.
   Key: LIVE_TEST_SA_KEY (the service-account JSON) or LIVE_TEST_SA_KEY_FILE (a path to it). Never print it.
   Run: cd tests && LIVE_TEST_SA_KEY_FILE=~/path/key.json node live/run.mjs */
import { readFileSync, appendFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { chromium } from 'playwright';
import { walkApplication, walkNomination, checkRow, checkNominees } from '../lib/forms.mjs';

const MODE = process.env.LIVE_MODE || 'full';
const SITE = process.env.LIVE_URL || 'https://v4air.eu';
const SHEET = process.env.LIVE_SHEET_ID || '1dDRwBAy8YIQUQIZDiYjlbabDyJ3ZXbUOfl6sznkQYdc';
const WAIT_MIN = +(process.env.LIVE_WAIT_MIN || 20);
const KEY = JSON.parse(process.env.LIVE_TEST_SA_KEY || readFileSync(process.env.LIVE_TEST_SA_KEY_FILE, 'utf8'));
const ROOT = new URL('../..', import.meta.url);
const RUN = Date.now().toString(36);
const mail = tag => `v4air-test-live-${RUN}-${tag}@example.com`;
const TEST_MAIL = /^v4air-test-live-[a-z0-9]+-[a-z0-9]+@example\.com$/;
const MAX_DELETE = 30; /* more test rows than this means something is wrong; delete nothing and fail */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- the real Sheet, through the Sheets API as the service account ---------- */
let tok;
async function token() {
  if (tok && tok.exp > Date.now()) return tok.v;
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url'), now = Math.floor(Date.now() / 1000);
  const unsigned = enc({ alg: 'RS256', typ: 'JWT' }) + '.' + enc({ iss: KEY.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + createSign('RSA-SHA256').update(unsigned).sign(KEY.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const j = await r.json(); if (!j.access_token) throw new Error('Google sign-in of the service account failed: ' + (j.error_description || j.error));
  tok = { v: j.access_token, exp: Date.now() + 50 * 60e3 }; return tok.v;
}
async function sheets(rest, opts = {}) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET}${rest}`, { ...opts, headers: { Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' } });
  const j = await r.json(); if (!r.ok) throw new Error(`Sheets API ${r.status}: ${j.error && j.error.message}`); return j;
}
/* a tab as { head, rows }, rows as objects by column name plus __row (the Sheet row number); typed values as stored */
async function table(tab) {
  const j = await sheets(`/values/${encodeURIComponent(tab)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`);
  const [head = [], ...raw] = j.values || [];
  return { head, rows: raw.map((r, i) => Object.assign(Object.fromEntries(head.map((h, k) => [h, r[k] ?? ''])), { __row: i + 2 })) };
}

/* ---------- cleanup: every row with a live-test address, bottom up, in one request ---------- */
const TEST_COLS = { Applications: 'A1.email', Nominations: 'B.email', Nominees: 'nominator_email' };
async function testRows() {
  const out = [];
  for (const [tab, col] of Object.entries(TEST_COLS)) for (const r of (await table(tab)).rows) if (TEST_MAIL.test(String(r[col]))) out.push({ tab, row: r.__row, id: r.response_id || r.nomination_id || '' });
  return out;
}
async function cleanup() {
  const ids = Object.fromEntries((await sheets('?fields=sheets.properties(sheetId,title)')).sheets.map(s => [s.properties.title, s.properties.sheetId]));
  const rows = await testRows();
  if (rows.length > MAX_DELETE) throw new Error(`cleanup refused: ${rows.length} rows look like test rows (limit ${MAX_DELETE}); check the Sheet by hand`);
  if (rows.length) {
    /* ponytail: rows are read, then deleted a moment later; a row deleted by hand in between would shift the numbers.
       Forms only append at the bottom, so new answers cannot shift them. */
    const requests = rows.filter(r => r.row >= 2).sort((a, b) => b.row - a.row).map(r => ({ deleteDimension: { range: { sheetId: ids[r.tab], dimension: 'ROWS', startIndex: r.row - 1, endIndex: r.row } } }));
    await sheets(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests }) });
  }
  const left = await testRows();
  if (left.length) throw new Error(`cleanup left ${left.length} test rows: ${left.map(r => `${r.tab} row ${r.row}`).join(', ')}`);
  return rows;
}

/* ---------- the live site ---------- */
const exe = process.env.CHROME || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe, headless: true } : { headless: true });
async function open(urlPath, opts = {}) {
  const c = await browser.newContext(), page = await c.newPage(), errors = [], posts = { worker: 0, gas: 0 };
  page.on('pageerror', e => errors.push(String(e)));
  page.on('dialog', d => d.accept());
  page.on('request', r => { if (r.method() !== 'POST') return; const h = new URL(r.url()).host; if (h.endsWith('workers.dev')) posts.worker++; if (h === 'script.google.com') posts.gas++; });
  await c.route('**/*', r => {
    const h = new URL(r.request().url()).host;
    if (/google-analytics\.com$|googletagmanager\.com$/.test(h)) return r.abort(); /* test visits stay out of the statistics */
    if (opts.blockWorker && h.endsWith('workers.dev')) return r.abort();
    return r.continue();
  });
  await page.goto(`${SITE}${urlPath}?ci=${RUN}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#form', { timeout: 90000 }).catch(() => { throw new Error(`${urlPath}: the form never appeared (a bot check of the hosting?)`); });
  return { c, page, errors, posts };
}
/* the fields of a page, as written in its HTML */
const fieldNames = html => [...new Set([...html.matchAll(/\bname="([^"]+)"/g)].map(m => m[1]))].sort();
async function waitForDeploy() {
  const until = Date.now() + WAIT_MIN * 60e3;
  for (const [urlPath, file] of [['/apply/', 'public/apply/index.html'], ['/nominate/', 'public/nominate/index.html']]) {
    const want = fieldNames(readFileSync(new URL(file, ROOT), 'utf8')).join('\n');
    for (let n = 0; ; n++) {
      const { c, page } = await open(urlPath);
      const got = fieldNames(await page.evaluate(() => fetch(location.href, { cache: 'no-store' }).then(r => r.text()))).join('\n');
      await c.close();
      if (got === want) { console.log(`live ${urlPath} matches this checkout`); break; }
      if (Date.now() > until) {
        const a = new Set(want.split('\n')), b = new Set(got.split('\n'));
        throw new Error(`live ${urlPath} still differs from this checkout after ${WAIT_MIN} min; only in the checkout: ${[...a].filter(x => !b.has(x)).slice(0, 8).join(', ') || '-'}; only live: ${[...b].filter(x => !a.has(x)).slice(0, 8).join(', ') || '-'}`);
      }
      if (n === 0) console.log(`live ${urlPath} is not this version yet; waiting (up to ${WAIT_MIN} min)`);
      await sleep(30000);
    }
  }
}

const BASE = { 'A1.country': 'Czechia', 'A1.stage': 'phd', 'A1.institution_key': 'cuni', 'A1.days_all': 'yes', 'A8.own_funding': 'yes', 'A8.own_funding_scope': 'part' };
const TRICKY = { 'A1.department': '=1+1', 'A1.field': '0123', 'A1.programme': '1/2', 'A1.link_1': '50%', 'A1.link_2': 'TRUE', 'A1.link_3': '2026-11-04' }; /* Sheets would turn these into a formula, numbers, a date */
async function application(label, over, opts = {}) {
  const { c, page, errors, posts } = await open('/apply/', opts);
  try {
    const { dom, id } = await walkApplication(page, over);
    return { label, form: 'A', tab: 'Applications', id, dom, errors, posts };
  } finally { await c.close(); }
}
const cardsFor = () => [
  { type: 'student', name: 'TEST Live Student Nominee', contact: mail('n1'), affiliation: '=1+1 Faculty', why: '0123 TEST works on bees' },
  { type: 'outside', name: 'TEST Live Outside Nominee', contact: mail('n2'), affiliation: 'TEST Startup', why: 'TEST builds detectors' }];
async function nomination(label, over, cards) {
  const { c, page, errors, posts } = await open('/nominate/');
  try {
    const { dom, id } = await walkNomination(page, over, cards);
    return { label, form: 'B', tab: 'Nominations', id, dom, errors, posts, nominator: over, cards };
  } finally { await c.close(); }
}

const results = [];
let removed = [];
try {
  await waitForDeploy();
  const runs = [];
  const tryRun = async (label, fn) => { try { runs.push(await fn()); } catch (e) { results.push({ label, bad: [String(e && e.message || e)] }); } };
  await tryRun('Application through the Worker', () => application('Application through the Worker', { ...BASE, ...(MODE === 'full' ? TRICKY : {}), 'A1.name': 'TEST Live Worker', 'A1.email': mail('worker') }));
  if (MODE === 'full') {
    await tryRun('Application, Worker blocked, Apps Script fallback', () => application('Application, Worker blocked, Apps Script fallback', { ...BASE, 'A1.name': 'TEST Live Fallback', 'A1.email': mail('fallback') }, { blockWorker: true }));
    await tryRun('Nomination with two nominees', () => nomination('Nomination with two nominees', { 'B.name': 'TEST Live Nominator', 'B.email': mail('nom'), 'B.application_id': '' }, cardsFor()));
  }
  await sleep(3000);
  const tabs = {};
  for (const run of runs) {
    tabs[run.tab] = tabs[run.tab] || await table(run.tab);
    let bad = checkRow(run, tabs[run.tab]);
    if (bad.some(b => b.startsWith('expected 1 row'))) { await sleep(15000); tabs[run.tab] = await table(run.tab); bad = checkRow(run, tabs[run.tab]); } /* a slow write */
    if (/Worker blocked/.test(run.label)) { if (!run.posts.gas) bad.push('Apps Script was never called'); }
    else if (!run.posts.worker) bad.push('the Worker was never called');
    if (run.form === 'B' && run.id) bad.push(...checkNominees({ id: run.id, nominator: { 'B.name': run.nominator['B.name'], 'B.email': run.nominator['B.email'] } }, (tabs.Nominees = tabs.Nominees || await table('Nominees')).rows, run.cards));
    results.push({ label: run.label, id: run.id, fields: run.fields, bad });
  }
} catch (e) {
  results.push({ label: 'Live site', bad: [String(e && e.message || e)] });
} finally {
  await browser.close();
  try { removed = await cleanup(); results.push({ label: `Cleanup (${removed.length} test rows deleted)`, bad: [] }); }
  catch (e) { results.push({ label: 'Cleanup', bad: [String(e && e.message || e)] }); }
}

for (const r of results) console.log((r.bad.length ? 'FAIL ' : 'PASS ') + r.label + (r.id ? ` ${r.id}, ${r.fields} fields` : '') + (r.bad.length ? '\n  - ' + r.bad.slice(0, 15).join('\n  - ') : ''));
const failed = results.filter(r => r.bad.length);
if (process.env.GITHUB_STEP_SUMMARY) {
  let md = `## Live form check (${MODE}): ${failed.length ? '❌ ' + failed.length + ' problem(s)' : '✅ answers reached the real Sheet as typed'}\n\n${SITE}, real backends, real Sheet; test rows deleted afterwards.\n\n| Check | Result |\n|---|---|\n`;
  md += results.map(r => `| ${r.label}${r.id ? ` (${r.id}, ${r.fields} fields)` : ''} | ${r.bad.length ? r.bad.map(x => x.replace(/\|/g, '\\|')).join('<br>') : 'pass'} |`).join('\n') + '\n';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
console.log(failed.length ? `\n${failed.length} problem(s)` : '\nall live checks passed');
process.exit(failed.length ? 1 : 0);
