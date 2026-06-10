'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, code: true, name: true },
  })

  const recipientsByCode = {
    // Canonical codes as stored in DB
    NHS_DARGA:    ['Bharath Kumar', 'Poornima', 'NHS BOB', 'NHS SBI', 'NHS Canara', 'Mani Teacher', 'Badrinath'],
    NS_SHAIKPET:  ['Bharath Kumar', 'Poornima', 'NS Canara', 'Accountant', 'Badrinath'],
    SVN_NARSINGI: ['Bharath Kumar', 'Poornima', 'SVN Canara', 'Accountant', 'Badrinath', 'Ashritha'],
    // Legacy short codes (fallback)
    DARGA:    ['Bharath Kumar', 'Poornima', 'NHS BOB', 'NHS SBI', 'NHS Canara', 'Mani Teacher', 'Badrinath'],
    SHAIKPET: ['Bharath Kumar', 'Poornima', 'NS Canara', 'Accountant', 'Badrinath'],
    NARSINGI: ['Bharath Kumar', 'Poornima', 'SVN Canara', 'Accountant', 'Badrinath', 'Ashritha'],
  }

  for (const branch of branches) {
    const names = recipientsByCode[branch.code?.toUpperCase()] ?? []
    for (let i = 0; i < names.length; i++) {
      await prisma.expenseRecipient.upsert({
        where: { id: `${branch.id}-${i}` },
        create: {
          id: `${branch.id}-${i}`,
          branchId: branch.id,
          name: names[i],
          sortOrder: i,
          isActive: true,
        },
        update: { name: names[i], sortOrder: i, isActive: true },
      })
    }
    console.log(`Seeded ${names.length} recipients for ${branch.name}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
