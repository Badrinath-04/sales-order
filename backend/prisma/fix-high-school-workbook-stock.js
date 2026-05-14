const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const WORKBOOK_STOCK = {
  NHS_DARGA: {
    'Telugu W.B': [80, 90, 90, 90, 60],
    'Hindi W.B': [80, 90, 90, 90, 60],
    'English W.B': [80, 90, 90, 90, 60],
    'Eng. Grammar': [80, 90, 90, 90, 0],
    'Mathematics W.B': [80, 90, 90, 90, 60],
    'Physical Science W.B': [80, 90, 90, 90, 60],
    'Physics Drawing': [80, 90, 90, 90, 60],
    'Biology W.B': [80, 90, 90, 90, 60],
    'Biology Drawing': [80, 90, 90, 90, 60],
    'Social Studies W.B': [80, 90, 90, 90, 60],
    'Map Pointing': [80, 90, 90, 90, 60],
    'Vedic Math': [80, 90, 90, 90, 0],
    'General Knowledge': [80, 90, 90, 0, 0],
    'Computer': [80, 90, 90, 90, 0],
    'Exam Booklet': [80, 90, 90, 90, 60],
    'Diary': [80, 90, 90, 90, 60],
  },
  SVN_NARSINGI: {
    'Telugu W.B': [50, 50, 40, 40, 30],
    'Hindi W.B': [50, 50, 40, 40, 30],
    'English W.B': [50, 50, 40, 40, 30],
    'Eng. Grammar': [50, 50, 40, 40, 30],
    'Mathematics W.B': [50, 50, 40, 40, 30],
    'Physical Science W.B': [50, 50, 40, 40, 30],
    'Physics Drawing': [50, 50, 40, 40, 30],
    'Biology W.B': [50, 50, 40, 40, 30],
    'Biology Drawing': [50, 50, 40, 40, 30],
    'Social Studies W.B': [50, 50, 40, 40, 30],
    'Map Pointing': [50, 50, 40, 40, 30],
    'Vedic Math': [50, 50, 40, 40, 30],
    'General Knowledge': [50, 50, 40, 0, 30],
    'Computer': [50, 50, 40, 40, 30],
    'Exam Booklet': [50, 50, 40, 40, 30],
    'Diary': [50, 50, 40, 40, 30],
  },
  NS_SHAIKPET: {
    'Telugu W.B': [55, 55, 50, 40, 40],
    'Hindi W.B': [55, 55, 50, 40, 40],
    'English W.B': [55, 55, 50, 40, 40],
    'Eng. Grammar': [55, 55, 50, 40, 40],
    'Mathematics W.B': [55, 55, 50, 40, 40],
    'Physical Science W.B': [55, 55, 50, 40, 40],
    'Physics Drawing': [55, 55, 50, 40, 40],
    'Biology W.B': [55, 55, 50, 40, 40],
    'Biology Drawing': [55, 55, 50, 40, 40],
    'Social Studies W.B': [55, 55, 50, 40, 40],
    'Map Pointing': [55, 55, 50, 40, 40],
    'Vedic Math': [55, 55, 50, 40, 40],
    'General Knowledge': [55, 55, 50, 40, 40],
    'Computer': [55, 55, 50, 40, 40],
    'Exam Booklet': [55, 55, 50, 40, 40],
    'Diary': [55, 55, 50, 40, 40],
  },
}

function subjectFromLabel(label) {
  const value = String(label || '')
  const idx = value.indexOf(' - ')
  return idx >= 0 ? value.slice(0, idx) : value
}

function tone(quantity) {
  if (quantity <= 10) return 'CRITICAL'
  if (quantity <= 25) return 'LOW'
  return 'NORMAL'
}

async function main() {
  let subItemsUpdated = 0
  let bundleStocksUpdated = 0
  const branches = await prisma.branch.findMany({
    where: { code: { in: Object.keys(WORKBOOK_STOCK) } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  })

  for (const branch of branches) {
    const classes = await prisma.academicClass.findMany({
      where: { branchId: branch.id, grade: { in: [6, 7, 8, 9, 10] } },
      include: {
        bookKits: {
          include: {
            items: {
              where: { isArchived: false, catalogKey: { startsWith: 'academic_workbooks_g' } },
              include: {
                subItems: { where: { isActive: true }, orderBy: { position: 'asc' } },
                bookStocks: { where: { branchId: branch.id } },
              },
            },
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    })

    for (const cls of classes) {
      const bundle = cls.bookKits?.[0]?.items?.find((item) => item.catalogKey === `academic_workbooks_g${cls.grade}`)
      if (!bundle) continue
      const gradeIndex = cls.grade - 6

      await prisma.$transaction(async (tx) => {
        for (const subItem of bundle.subItems) {
          const subject = subjectFromLabel(subItem.label)
          const nextQty = WORKBOOK_STOCK[branch.code]?.[subject]?.[gradeIndex]
          if (typeof nextQty !== 'number') continue
          if (subItem.quantity !== nextQty) {
            await tx.bookKitSubItem.update({ where: { id: subItem.id }, data: { quantity: nextQty } })
            subItemsUpdated += 1
          }
        }

        const expectedBundleStock = Math.max(
          0,
          ...bundle.subItems.map((subItem) => {
            const subject = subjectFromLabel(subItem.label)
            return WORKBOOK_STOCK[branch.code]?.[subject]?.[gradeIndex] ?? 0
          }),
        )

        await tx.bookStock.upsert({
          where: { itemId_branchId: { itemId: bundle.id, branchId: branch.id } },
          create: { itemId: bundle.id, branchId: branch.id, quantity: expectedBundleStock, tone: tone(expectedBundleStock) },
          update: { quantity: expectedBundleStock, tone: tone(expectedBundleStock) },
        })
        bundleStocksUpdated += 1
      }, { timeout: 30000 })
    }
  }

  console.log(`Updated ${subItemsUpdated} workbook sub-item quantity value(s)`)
  console.log(`Updated ${bundleStocksUpdated} workbook bundle stock row(s)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
