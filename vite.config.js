import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so http://localhost:5173 and http://<LAN-IP>:5173 both work
    host: true,
    proxy: {
      // Same-origin `/api` in dev so localhost:5173 and LAN:5173 both reach the backend
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
