const app = require('./app')
const config = require('./config')
const prisma = require('./services/prisma')

async function main() {
  await prisma.$connect()
  console.log('[DB] Connected to PostgreSQL via Prisma')

  app.listen(config.port, () => {
    console.log(`[SERVER] Running on http://localhost:${config.port} (${config.nodeEnv})`)
  })
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
