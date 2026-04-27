// Load env before app (app pulls Prisma via controllers); avoids edge cases on reload.
require('./config')
const app = require('./app')
const config = require('./config')
const prisma = require('./services/prisma')

async function main() {
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL via Prisma')

  const server = app.listen(config.port, () => {
    console.log(`[SERVER] Running on http://localhost:${config.port} (${config.nodeEnv})`)
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

