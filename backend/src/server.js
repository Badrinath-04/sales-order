// Load env before app (app pulls Prisma via controllers); avoids edge cases on reload.
const os = require('node:os')
require('./config')
const app = require('./app')
const config = require('./config')
const prisma = require('./services/prisma')

function firstLanIPv4() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      const v4 = n && (n.family === 'IPv4' || n.family === 4)
      if (v4 && !n.internal) return n.address
    }
  }
  return null
}

async function main() {
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL via Prisma')

  const server = app.listen(config.port, config.host, () => {
    console.log(`[SERVER] http://localhost:${config.port} (${config.nodeEnv})`)
    if (config.host === '0.0.0.0') {
      const lan = firstLanIPv4()
      if (lan) console.log(`[SERVER] http://${lan}:${config.port} (LAN — other devices on this network)`)
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

