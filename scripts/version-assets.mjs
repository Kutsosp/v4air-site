// Runs after the copy to dist/ (scripts/build-static.mjs). Gives consent.js, forms-api.js, site.js, assets/site.css and vendor/motion.js a content-based address in every built page
// (consent.js?v=<hash>), so neither browsers nor the CDN in front of v4air.eu can keep running an old copy after a deploy.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const version = (f) => createHash('sha256').update(readFileSync(join(DIST, f))).digest('hex').slice(0, 10)
const v = { consent: version('consent.js'), 'forms-api': version('forms-api.js'), site: version('site.js'), 'assets/site': version('assets/site.css'), 'vendor/motion': version('vendor/motion.js') }
const pages = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n)
  return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : []
})

let changed = 0
for (const page of pages(DIST)) {
  const html = readFileSync(page, 'utf8')
  const out = html.replace(/((?:\/|\.\.\/)(consent|forms-api|site|assets\/site|vendor\/motion)\.(?:js|css))(\?v=[0-9a-f]+)?"/g, (_, path, name) => `${path}?v=${v[name]}"`)
  if (out !== html) { writeFileSync(page, out); changed++ }
}
if (!changed) throw new Error('no page references consent.js or forms-api.js')
console.log(`versioned consent.js, forms-api.js, site.js and site.css in ${changed} pages`)
