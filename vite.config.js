import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { getLanIPv4Addresses } = require('./scripts/lan-host.cjs')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Print LAN URLs so other devices on the same Wi‑Fi can open the dev app. */
function lanNetworkUrlsPlugin() {
  return {
    name: 'lan-network-urls',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer.address()
        const port = typeof addr === 'object' && addr ? addr.port : server.config.server.port
        const lan = getLanIPv4Addresses()
        if (lan.length === 0) {
          console.log('  ➜  Network: (no LAN IPv4 — connect Wi‑Fi/Ethernet or check firewall)')
          return
        }
        for (const ip of lan) {
          console.log(`  ➜  Network: http://${ip}:${port}/`)
        }
        console.log('  ➜  Tip: run the backend too (`cd backend && npm run dev`) — API is proxied via /api')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), lanNetworkUrlsPlugin()],
  server: {
    // 0.0.0.0 = listen on all interfaces (localhost + LAN IP)
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      // Same-origin `/api` in dev — works for localhost:5173 and http://<LAN-IP>:5173
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
