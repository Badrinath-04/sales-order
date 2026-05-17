/**
 * One-time: set operational branch display names to Darga / Narsingi / Shaikpet.
 * Run: node prisma/rename-branches-short.js
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TARGETS = [
  { codes: ['CAMP-A', 'NHS_DARGA'], name: 'Darga' },
  { codes: ['CAMP-B', 'SVN_NARSINGI'], name: 'Narsingi' },
  { codes: ['CAMP-C', 'NS_SHAIKPET'], name: 'Shaikpet' },
]

async function main() {
  for (const { codes, name } of TARGETS) {
    const result = await prisma.branch.updateMany({
      where: { code: { in: codes } },
      data: { name },
    })
    console.log(`${name}: updated ${result.count} row(s) for codes ${codes.join(', ')}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
