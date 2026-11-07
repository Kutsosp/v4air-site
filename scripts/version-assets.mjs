// Runs after `vite build`. Gives consent.js and forms-api.js a content-based address in every built page
// (consent.js?v=<hash>), so neither browsers nor the CDN in front of v4air.eu can keep running an old copy after a deploy.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const version = (f) => createHash('sha256').update(readFileSync(join(DIST, f))).digest('hex').slice(0, 10)
const v = { consent: version('consent.js'), 'forms-api': version('forms-api.js') }
const pages = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n)
  return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : []
})

let changed = 0
for (const page of pages(DIST)) {
  const html = readFileSync(page, 'utf8')
  const out = html.replace(/((?:\/|\.\.\/)(consent|forms-api)\.js)(\?v=[0-9a-f]+)?"/g, (_, path, name) => `${path}?v=${v[name]}"`)
  if (out !== html) { writeFileSync(page, out); changed++ }
}
if (!changed) throw new Error('no page references consent.js or forms-api.js')
console.log(`versioned consent.js (${v.consent}) and forms-api.js (${v['forms-api']}) in ${changed} pages`)
