/* The browser side of the form tests: answer every visible question like a person, read back what the page holds,
   walk a whole form, and compare what was sent with the Sheet row. Shared by forms/run.mjs (imitated Sheet) and live/run.mjs (the real site and Sheet). */
export const LIST = () => {
  const s = document.querySelector('.screen.active') || document.querySelector('form'); let n = window.__ti || 0; const out = [];
  s.querySelectorAll('input,select,textarea').forEach(el => {
    if (el.type === 'hidden' || el.type === 'file' || el.id === 'hp' || el.disabled) return;
    if (!(el.offsetParent !== null || (el.closest('label') && el.closest('label').offsetParent !== null))) return;
    if (!el.dataset.ti) el.dataset.ti = ++n;
    out.push({ ti: el.dataset.ti, name: el.name || '', id: el.id || '', type: el.type, tag: el.tagName, cls: el.className || '', value: el.value });
  });
  window.__ti = n; return out;
};
export const DOM_STATE = sel => {
  const f = document.querySelector(sel), o = {};
  f.querySelectorAll('input,select,textarea').forEach(el => {
    if (!el.name || el.id === 'hp' || el.type === 'file') return;
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ''; }
    else o[el.name] = el.value;
  });
  return o;
};
export const SKIP_TICK = new Set(['A3.none']); /* "I don't use AI yet" skips the method screens; ticked only when a scenario asks */
export const text = (name, kind) => (kind === 'url' ? 'https://example.com/test/' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `TEST ${name} Příliš žluťoučký kůň 😀 "q" <b>&amp;` + (kind === 'textarea' ? '\nsecond line' : ''));
export async function fillScreen(page, over) {
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
export const active = page => page.evaluate(() => (document.querySelector('.screen.active') || {}).dataset ? document.querySelector('.screen.active').dataset.key : '');
export async function next(page) {
  const k = await active(page);
  await page.locator('#btn-next').click();
  await page.waitForFunction(k => { const a = document.querySelector('.screen.active'); const e = document.querySelector('#err-summary.on'); return (a && a.dataset.key !== k) || !!e; }, k, { timeout: 60000 });
  const err = await page.evaluate(() => { const e = document.querySelector('#err-summary.on'); return e ? e.innerText : ''; });
  if (err) throw new Error(`screen ${k} did not advance: ${err.replace(/\s+/g, ' ')}`);
}

/* Application: from the intro to the last screen, answers from `over` where given; extra(page, key) runs on each screen.
   Returns the page state just before sending and the ID the backend gave back. */
export async function walkApplication(page, over, extra = async () => {}) {
  await page.locator('.screen.active [data-next]').first().click();
  for (let i = 0; i < 25; i++) {
    const k = await active(page);
    await fillScreen(page, over);
    if (k === 'a2') for (const kw of ['alpha', 'beta 2', 'gamma']) { await page.locator('#kw-input').fill(kw); await page.locator('#kw-input').press('Enter'); } /* the way the hint says: Enter after each */
    await extra(page, k);
    if (k === 'a8') {
      const dom = await page.evaluate(DOM_STATE, '#form');
      await next(page);
      const id = await page.evaluate(() => JSON.parse(localStorage.getItem('v4air-form-a-live-v1') || '{}').__id);
      return { dom, id };
    }
    await next(page);
  }
  throw new Error('never reached the last screen');
}

/* Nomination: the nominator (B.name, B.email in `over`), then one card per entry of `cards`. */
export async function walkNomination(page, over, cards) {
  await page.locator('.screen.active [data-next]').first().click();
  await page.locator('#B\\.name').fill(over['B.name']); await page.locator('#B\\.email').fill(over['B.email']); await page.locator('#B\\.institution').fill('TEST Přírodovědecká fakulta');
  await next(page);
  for (const [i, card] of cards.entries()) {
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
  return { dom, id };
}

/* ---------- checks: the page state against the Sheet (table = { head: column names, rows: objects by column }) ---------- */
export function checkRow(run, { head, rows }) {
  const bad = [], hits = rows.filter(r => r.response_id === run.id);
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
export function checkNominees(run, rows, CARDS) {
  const got = rows.filter(r => r.nomination_id === run.id).sort((a, b) => a.n - b.n), bad = [];
  if (got.length !== CARDS.length) return [`expected ${CARDS.length} Nominees rows, found ${got.length}`];
  got.forEach((r, i) => {
    for (const [k, v] of Object.entries(CARDS[i])) if (String(r[k]) !== v) bad.push(`nominee ${i + 1}.${k}: typed ${JSON.stringify(v)}, Sheet has ${JSON.stringify(r[k])}`);
    if (r.nominator_name !== run.nominator['B.name'] || r.nominator_email !== run.nominator['B.email'] || r.n !== i + 1) bad.push(`nominee ${i + 1}: nominator columns wrong`);
  });
  return bad;
}

