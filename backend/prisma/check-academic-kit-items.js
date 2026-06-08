require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Check affected grades: UKG(-1), Nursery(-2), I(1), II(2), III(3), IV(4), V(5), VI(6) at Shaikpet
  const branches = await p.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } })

  for (const b of branches) {
    console.log(`\n=== ${b.name} ===`)
    const grades = [-2, -1, 0, 1, 2, 3, 4, 5, 6]
    for (const grade of grades) {
      // Find section A class
      const cls = await p.academicClass.findFirst({
        where: { branchId: b.id, grade, section: 'A' },
        include: {
          bookKits: {
            where: { kind: 'ACADEMIC' },
            include: {
              items: {
                include: { bookStocks: { where: { branchId: b.id }, select: { quantity: true } } },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      })

      if (!cls) { console.log(`  Grade ${grade}: No section-A class`); continue }
      const kit = cls.bookKits[0]
      if (!kit) { console.log(`  Grade ${grade}: No ACADEMIC kit for section A`); continue }

      const activeItems = kit.items.filter(it => !it.isArchived)
      const archivedItems = kit.items.filter(it => it.isArchived)
      const textbookItems = activeItems.filter(it => it.label.toLowerCase().includes('textbook'))
      const stock = textbookItems.map(it => it.bookStocks[0]?.quantity ?? 'no-stock')

      console.log(`  Grade ${grade} (section A): ${activeItems.length} active items, ${archivedItems.length} archived`)
      console.log(`    Textbook items: ${textbookItems.map(it => `"${it.label}" (${it.productType}) stock=${it.bookStocks[0]?.quantity ?? 'none'}`).join(', ') || 'NONE ⚠️'}`)
      if (activeItems.length > 0) {
        console.log(`    All active: ${activeItems.map(it => it.label).join(', ')}`)
      }
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect())
