import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* Builds /people as one self-contained HTML file (photos, scripts and styles inlined),
   which scripts/build-people.mjs then encrypts with StatiCrypt. The source lives in
   gitignored people-src/ and src/people-page/; only the encrypted page is committed. */
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist-people',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { input: path.resolve(__dirname, 'people-src/index.html') },
  },
})
