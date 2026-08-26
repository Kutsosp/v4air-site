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
})
