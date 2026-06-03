const prisma = require('../services/prisma')

function isTransientConnectionError(err) {
  const msg = String(err?.message ?? '')
  return (
    err?.code === 'P2024' ||
    err?.code === 'P1001' ||
    err?.code === 'P1017' ||
    msg.includes('Server has closed the connection') ||
    msg.includes('Timed out fetching a new connection from the connection pool') ||
    msg.includes('Error in PostgreSQL connection') ||
    msg.includes("Can't reach database server")
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withDbRetry(fn, { attempts = 2, delayMs = 150 } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientConnectionError(err) || attempt === attempts) throw err
      try {
        await prisma.$connect()
      } catch {
        // Retry may still succeed on the next attempt.
      }
      await sleep(delayMs)
    }
  }
  throw lastErr
}

module.exports = { isTransientConnectionError, withDbRetry }
