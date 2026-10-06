// Build the password-protected /people page.
// Usage: PEOPLE_PASSWORD=... node scripts/build-people.mjs
// 1. builds people-src/ into one self-contained HTML file (vite.people.config.ts)
// 2. encrypts it with StatiCrypt into public/people/index.html (the only committed output)
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'

const password = process.env.PEOPLE_PASSWORD
if (!password) throw new Error('Set PEOPLE_PASSWORD')

execSync('npx vite build --config vite.people.config.ts', { stdio: 'inherit' })

const src = 'dist-people/people-src/index.html'
const html = readFileSync(src, 'utf8').replace(
  '<head>',
  '<head>\n    <meta name="robots" content="noindex, nofollow" />',
)
writeFileSync(src, html)

const args = [
  `"${src}"`,
  '-p', JSON.stringify(password),
  '--short',
  '--remember', '30',
  '-d', 'dist-people/encrypted',
  '--template-title', '"V4AIR"',
  '--template-instructions', '""',
  '--template-placeholder', '"Password"',
  '--template-button', '"Open"',
  '--template-error', '"Wrong password"',
  '--template-remember', '"Remember me"',
  '--template-color-primary', '"#dd7f3e"',
  '--template-color-secondary', '"#f2f3ec"',
].join(' ')
execSync(`npx staticrypt ${args}`, { stdio: 'inherit' })

let out = readFileSync('dist-people/encrypted/index.html', 'utf8')
if (!out.includes('name="robots"')) {
  out = out.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />')
}
mkdirSync('public/people', { recursive: true })
writeFileSync('public/people/index.html', out)
rmSync('dist-people/encrypted', { recursive: true, force: true })
console.log('public/people/index.html written (' + Math.round(out.length / 1024) + ' kB)')
