/* Site check: opens every page under public/ in Chrome (outside requests blocked, so it is fast and repeatable) and fails on
   - a JavaScript error on the page;
   - an internal link, image, stylesheet or script that does not exist (404);
   - structured data (<script type="application/ld+json">) that is not valid JSON;
   - a copy rule broken (rules.mjs): "conference" outside the agreed sentences, a price outside /pricing/, a partner list
     without all six universities;
   - sideways scrolling at phone width (360 and 390 px), on every page and on every screen of the forms.
   Run: cd tests && npm install && npx playwright install chromium && node site/check.mjs   (CHROME=path uses a local Chrome)
   Writes a Markdown summary to $GITHUB_STEP_SUMMARY in GitHub Actions. */
import { readdirSync, statSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { CONFERENCE_ALLOWED, PRICE_PAGES, PRICE_RE, PARTNERS, PARTNERS_MIN, PHONE_WIDTHS } from './rules.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname), PUB = path.join(ROOT, 'public'), PORT = 4320, SITE = `http://127.0.0.1:${PORT}`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon', '.pdf': 'application/pdf' };
const resolveFile = p => { let f = path.join(PUB, decodeURIComponent(p)); if (!f.startsWith(PUB)) return null; if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html'); return existsSync(f) ? f : null; };
http.createServer((req, res) => {
  const f = resolveFile(new URL(req.url, SITE).pathname);
  if (!f) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(PORT, '127.0.0.1');

const pages = [];
(function walk(d) { for (const n of readdirSync(d)) { const f = path.join(d, n); if (statSync(f).isDirectory()) { if (!['assets', 'vendor', 'node_modules'].includes(n)) walk(f); } else if (n === 'index.html' || n === '404.html') pages.push('/' + path.relative(PUB, f).replace(/index\.html$/, '')); } })(PUB);

const exe = process.env.CHROME || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe, headless: true } : { headless: true });
const results = [];
/* visible text of the page source: scripts and styles removed, structured data kept (search engines show it) */
function pageText(file) {
  const s = readFileSync(file, 'utf8');
  const ld = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]).join(' ');
  const ent = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', ndash: '\u2013', mdash: '\u2014', euro: '€', middot: '·', hellip: '…', rarr: '→', larr: '←' };
  return (s.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ') + ' ' + ld)
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ent[e] || m))
    .replace(/\s+/g, ' ');
}
function copyRules(url) {
  const t = pageText(resolveFile(url)), bad = [];
  let clean = t; for (const a of CONFERENCE_ALLOWED) clean = clean.split(a).join('');
  for (const m of clean.matchAll(/.{0,40}\bconferences?\b.{0,40}/gi)) bad.push(`copy rule: "conference" (say "meetup"): …${m[0].trim()}…`);
  if (!PRICE_PAGES.includes(url)) for (const m of t.matchAll(new RegExp('.{0,40}' + PRICE_RE.source + '.{0,20}', 'g'))) bad.push(`copy rule: price outside /pricing/: …${m[0].trim()}…`);
  const named = Object.entries(PARTNERS).filter(([, re]) => re.test(t)).map(([n]) => n);
  if (named.length >= PARTNERS_MIN && named.length < Object.keys(PARTNERS).length) bad.push(`copy rule: partner list without ${Object.keys(PARTNERS).filter(n => !named.includes(n)).join(', ')}`);
  return bad;
}
async function phoneWidth(url) {
  const bad = [];
  for (const w of PHONE_WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true }), page = await ctx.newPage();
    await ctx.route('**/*', r => (r.request().url().startsWith(SITE) ? r.continue() : r.abort()));
    try { await page.goto(SITE + url, { waitUntil: 'load', timeout: 30000 }); await page.waitForTimeout(300); } catch (e) { await ctx.close(); continue; }
    /* every screen of a multi-screen form, one at a time; otherwise the page as it opens */
    const over = await page.evaluate(() => {
      const wide = () => { const d = document.documentElement; return d.scrollWidth - d.clientWidth; };
      const screens = [...document.querySelectorAll('.screen')], out = [];
      if (!screens.length) { const x = wide(); if (x > 1) out.push(['page', x]); return out; }
      screens.forEach(s => {
        screens.forEach(o => o.classList.toggle('active', o === s));
        s.querySelectorAll('.hid').forEach(h => h.classList.remove('hid'));   /* revealed parts too */
        const x = wide(); if (x > 1) out.push([s.dataset.key || 'screen', x]);
      });
      return out;
    });
    over.forEach(([where, x]) => bad.push(`phone width ${w} px: ${where} is ${x} px wider than the screen (sideways scrolling)`));
    await ctx.close();
  }
  return bad;
}
for (const url of pages.sort()) {
  const ctx = await browser.newContext(), page = await ctx.newPage(), bad = [];
  await ctx.route('**/*', r => (r.request().url().startsWith(SITE) ? r.continue() : r.abort()));
  page.on('pageerror', e => bad.push('JavaScript error: ' + String(e.message || e).split('\n')[0]));
  page.on('response', r => { if (r.status() === 404 && r.url().startsWith(SITE)) bad.push('missing file loaded by the page: ' + r.url().slice(SITE.length)); });
  try { await page.goto(SITE + url, { waitUntil: 'load', timeout: 30000 }); await page.waitForTimeout(400); }
  catch (e) { bad.push('page did not load: ' + e.message.split('\n')[0]); }
  const refs = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href], img[src], link[rel="stylesheet"][href], script[src], source[srcset]').forEach(el => {
      const raw = el.getAttribute('href') || el.getAttribute('src') || (el.getAttribute('srcset') || '').split(/\s+/)[0];
      if (!raw || /^(mailto:|tel:|javascript:|data:|#)/.test(raw)) return;
      const u = new URL(raw, location.href); if (u.origin !== location.origin) return;
      out.push({ tag: el.tagName.toLowerCase(), path: u.pathname });
    });
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent);
    return { out, ld };
  }).catch(() => ({ out: [], ld: [] }));
  const seen = new Set();
  for (const r of refs.out) { if (seen.has(r.path)) continue; seen.add(r.path); if (!resolveFile(r.path)) bad.push(`broken ${r.tag === 'a' ? 'link' : r.tag} to ${r.path}`); }
  refs.ld.forEach((t, i) => { try { JSON.parse(t); } catch (e) { bad.push(`structured data block ${i + 1} is not valid JSON: ${e.message}`); } });
  await ctx.close();
  bad.push(...copyRules(url), ...await phoneWidth(url));
  results.push({ url, bad: [...new Set(bad)] });
}
await browser.close();

const failed = results.filter(r => r.bad.length);
for (const r of results) console.log((r.bad.length ? 'FAIL ' : 'PASS ') + r.url + (r.bad.length ? '\n  - ' + r.bad.join('\n  - ') : ''));
if (process.env.GITHUB_STEP_SUMMARY) {
  let md = `## Site check: ${failed.length ? '❌ ' + failed.length + ' of ' + results.length + ' pages have problems' : '✅ all ' + results.length + ' pages fine'}\n\nEvery page opened in Chrome; checked for JavaScript errors, broken internal links and files, invalid structured data, the copy rules in \`tests/site/rules.mjs\`, and sideways scrolling at phone width (360 and 390 px, every form screen).\n\n`;
  if (failed.length) md += '| Page | Problems |\n|---|---|\n' + failed.map(r => `| ${r.url} | ${r.bad.map(x => x.replace(/\|/g, '\\|')).join('<br>')} |`).join('\n') + '\n';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
console.log(failed.length ? `\n${failed.length} page(s) with problems` : `\nall ${results.length} pages fine`);
process.exit(failed.length ? 1 : 0);
