const path = require('path')
const { PrismaClient } = require('@prisma/client')

// Ensure .env is loaded before Prisma reads DATABASE_URL (works regardless of require order).
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const log =
  process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']

/**
 * In development, nodemon reloads this module without exiting Node. A new PrismaClient
 * each time leaves stale TCP connections and triggers: prisma:error … kind: Closed.
 * Reuse one client on globalThis during dev only.
 */
function createClient() {
  return new PrismaClient({ log })
}

const prisma =
  process.env.NODE_ENV === 'production'
    ? createClient()
    : globalThis.__prismaSingleton ?? (globalThis.__prismaSingleton = createClient())

module.exports = prisma
