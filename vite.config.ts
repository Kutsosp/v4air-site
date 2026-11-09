import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  /* GitHub Pages serves from /v4air-site/ until the custom domain lands;
     CI sets PAGES_BASE, local dev and the domain build use '/' */
  base: process.env.PAGES_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  /* second page: /kostelec/ (the venue) */
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        kostelec: path.resolve(__dirname, 'kostelec/index.html'),
        programme: path.resolve(__dirname, 'programme/index.html'),
        faq: path.resolve(__dirname, 'faq/index.html'),
      },
    },
  },
})
