// Build for the plain-HTML site (10.11.2026): public/ is the site. Copies it to dist/ and versions
// the shared scripts and stylesheet (scripts/version-assets.mjs). No bundler involved.
import { cpSync, rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
cpSync('public', 'dist', { recursive: true })
await import('./version-assets.mjs')
