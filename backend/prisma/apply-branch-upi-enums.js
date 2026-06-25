#!/usr/bin/env node
'use strict'
/**
 * Adds branch-specific UPI PaymentMethod enum values to PostgreSQL.
 * Safe to re-run (uses IF NOT EXISTS).
 */
const { PrismaClient } = require('@prisma/client')

const VALUES = ['UPI_RAJANI', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_BHARATHI']

async function main() {
  const prisma = new PrismaClient()
  try {
    for (const value of VALUES) {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS '${value}'`,
      )
      console.log(`✓ PaymentMethod.${value}`)
    }
    console.log('\nDone — restart the backend if it is running.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
