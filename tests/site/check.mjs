/* Site check: opens every page under public/ in Chrome (outside requests blocked, so it is fast and repeatable) and fails on
   - a JavaScript error on the page;
   - an internal link, image, stylesheet or script that does not exist (404);
   - structured data (<script type="application/ld+json">) that is not valid JSON.
   Run: cd tests && npm install && npx playwright install chromium && node site/check.mjs   (CHROME=path uses a local Chrome)
   Writes a Markdown summary to $GITHUB_STEP_SUMMARY in GitHub Actions. */
import { readdirSync, statSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

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
  results.push({ url, bad: [...new Set(bad)] });
  await ctx.close();
}
await browser.close();

const failed = results.filter(r => r.bad.length);
for (const r of results) console.log((r.bad.length ? 'FAIL ' : 'PASS ') + r.url + (r.bad.length ? '\n  - ' + r.bad.join('\n  - ') : ''));
if (process.env.GITHUB_STEP_SUMMARY) {
  let md = `## Site check: ${failed.length ? '❌ ' + failed.length + ' of ' + results.length + ' pages have problems' : '✅ all ' + results.length + ' pages fine'}\n\nEvery page opened in Chrome; checked for JavaScript errors, broken internal links and files, and invalid structured data.\n\n`;
  if (failed.length) md += '| Page | Problems |\n|---|---|\n' + failed.map(r => `| ${r.url} | ${r.bad.map(x => x.replace(/\|/g, '\\|')).join('<br>')} |`).join('\n') + '\n';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
console.log(failed.length ? `\n${failed.length} page(s) with problems` : `\nall ${results.length} pages fine`);
process.exit(failed.length ? 1 : 0);
