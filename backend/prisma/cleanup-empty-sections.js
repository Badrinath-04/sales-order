const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TARGET_BRANCH_CODES = ['NHS_DARGA', 'NS_SHAIKPET', 'SVN_NARSINGI']

async function deleteClasses(tx, classIds) {
  if (!classIds.length) return { classes: 0, kits: 0, items: 0 }

  const kits = await tx.bookKit.findMany({
    where: { classId: { in: classIds } },
    select: { id: true },
  })
  const kitIds = kits.map((kit) => kit.id)

  const items = kitIds.length
    ? await tx.bookKitItem.findMany({
        where: { kitId: { in: kitIds } },
        select: { id: true },
      })
    : []
  const itemIds = items.map((item) => item.id)

  if (itemIds.length) {
    await tx.inventoryLog.deleteMany({ where: { bookItemId: { in: itemIds } } })
    await tx.stockTransferItem.deleteMany({ where: { bookItemId: { in: itemIds } } })
    await tx.orderItem.deleteMany({ where: { bookItemId: { in: itemIds } } })
    await tx.procurementEntry.deleteMany({ where: { bookItemId: { in: itemIds } } })
    await tx.bookStock.deleteMany({ where: { itemId: { in: itemIds } } })
    await tx.bookKitSubItem.deleteMany({ where: { kitItemId: { in: itemIds } } })
    await tx.bookKitItem.deleteMany({ where: { id: { in: itemIds } } })
  }

  if (kitIds.length) {
    await tx.bookKit.deleteMany({ where: { id: { in: kitIds } } })
  }

  const deleted = await tx.academicClass.deleteMany({ where: { id: { in: classIds } } })
  return { classes: deleted.count, kits: kitIds.length, items: itemIds.length }
}

async function main() {
  const branches = await prisma.branch.findMany({
    where: { code: { in: TARGET_BRANCH_CODES } },
    select: { id: true, code: true, name: true },
  })

  let totalClasses = 0
  let totalKits = 0
  let totalItems = 0

  for (const branch of branches) {
    const classes = await prisma.academicClass.findMany({
      where: {
        branchId: branch.id,
        grade: { gte: -2, lte: 10 },
      },
      select: {
        id: true,
        grade: true,
        section: true,
        label: true,
        academicYear: true,
        _count: { select: { students: true } },
      },
      orderBy: [
        { grade: 'asc' },
        { section: 'asc' },
        { academicYear: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const deleteIds = new Set()

    for (const cls of classes) {
      if (cls.grade !== -2 && cls._count.students === 0) {
        deleteIds.add(cls.id)
      }
    }

    const nurseryRows = classes.filter((cls) => cls.grade === -2)
    const nurseryA = nurseryRows.filter((cls) => String(cls.section).toUpperCase() === 'A')
    const keepNursery = nurseryA[0] ?? nurseryRows[0] ?? null
    for (const cls of nurseryRows) {
      if (!keepNursery || cls.id !== keepNursery.id) {
        deleteIds.add(cls.id)
      }
    }

    const result = await prisma.$transaction((tx) => deleteClasses(tx, Array.from(deleteIds)), { timeout: 30000 })
    totalClasses += result.classes
    totalKits += result.kits
    totalItems += result.items

    const remaining = await prisma.academicClass.findMany({
      where: { branchId: branch.id, grade: { gte: -2, lte: 10 } },
      select: {
        id: true,
        grade: true,
        section: true,
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    })

    for (const cls of remaining) {
      await prisma.academicClass.update({
        where: { id: cls.id },
        data: { studentCount: cls._count.students },
      })
    }

    console.log(`${branch.code}: deleted ${result.classes} empty section row(s), ${result.kits} kit(s), ${result.items} product row(s)`)
  }

  console.log(`Total deleted: ${totalClasses} section row(s), ${totalKits} kit(s), ${totalItems} product row(s)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
