'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.expenseEntry.updateMany({
    where: { entryType: 'EXPENSE' },
    data: {
      entryType: 'HANDOVER',
      category: 'MISCELLANEOUS',
    },
  })
  console.log(`Migrated ${result.count} EXPENSE entries → HANDOVER + MISCELLANEOUS`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
