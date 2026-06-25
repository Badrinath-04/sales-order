#!/usr/bin/env node
'use strict'
/**
 * Applies Finance overhaul schema changes (idempotent). Safe to re-run.
 */
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const SQL_PATH = path.join(__dirname, 'migrations/20260625150000_finance_overhaul_columns/migration.sql')

function splitStatements(sql) {
  const statements = []
  let current = ''
  let inDollarQuote = false
  for (const line of sql.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('--') || trimmed === '') continue
    current += `${line}\n`
    if (line.includes('$$')) inDollarQuote = !inDollarQuote
    if (!inDollarQuote && trimmed.endsWith(';')) {
      statements.push(current.trim())
      current = ''
    }
  }
  if (current.trim()) statements.push(current.trim())
  return statements.filter(Boolean)
}

async function main() {
  const sql = fs.readFileSync(SQL_PATH, 'utf8')
  const statements = splitStatements(sql)
  const prisma = new PrismaClient()
  try {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement)
    }
    console.log(`✓ Finance overhaul columns applied (${statements.length} statements)`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
