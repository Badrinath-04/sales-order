// Load env before app (app pulls Prisma via controllers); avoids edge cases on reload.
const path = require('node:path')
require('./config')
const app = require('./app')
const config = require('./config')
const prisma = require('./services/prisma')
const { getLanIPv4Addresses } = require(path.join(__dirname, '../../scripts/lan-host.cjs'))

async function main() {
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL via Prisma')

  const server = app.listen(config.port, config.host, () => {
    console.log(`[SERVER] Local:   http://localhost:${config.port} (${config.nodeEnv})`)
    if (config.host === '0.0.0.0' || config.host === '::') {
      const lan = getLanIPv4Addresses()
      if (lan.length === 0) {
        console.log('[SERVER] Network: (no LAN IPv4 — connect Wi‑Fi/Ethernet or check firewall)')
      } else {
        for (const ip of lan) {
          console.log(`[SERVER] Network: http://${ip}:${config.port}`)
        }
      }
    } else {
      console.log(`[SERVER] http://${config.host}:${config.port}`)
    }
  })

  const shutdown = async (signal) => {
    console.log(`[SERVER] ${signal} — closing…`)
    await new Promise((resolve) => server.close(resolve))
    await prisma.$disconnect().catch(() => {})
    process.exit(0)
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})

