/**
 * Hard-delete BookKitItem rows matching exact labels (all kits / branches).
 * Clears FK references first (orders keep line rows with bookItemId nulled).
 *
 * Run: node backend/scripts/delete-book-products-by-label.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/** Labels from Nursery kit UI (apply globally). */
const LABELS = [
  'Workbooks Set - Nursery',
  'ZZ_TEST_BUNDLE_3',
  'Textbooks (Set of 3)',
  'Workbooks (Semester 1)',
  'Notebooks (Lined/Grid)',
]

async function main() {
  const items = await prisma.bookKitItem.findMany({
    where: { label: { in: LABELS } },
    select: { id: true, label: true },
  })
  if (!items.length) {
    console.log('No matching BookKitItem rows.')
    return
  }

  const ids = items.map((i) => i.id)
  console.log('Deleting', ids.length, 'rows:', [...new Set(items.map((i) => i.label))].join(', '))

  await prisma.stockTransferItem.deleteMany({ where: { bookItemId: { in: ids } } })
  await prisma.inventoryLog.deleteMany({ where: { bookItemId: { in: ids } } })
  await prisma.bookStock.deleteMany({ where: { itemId: { in: ids } } })

  await prisma.orderItem.updateMany({
    where: { bookItemId: { in: ids } },
    data: { bookItemId: null },
  })

  await prisma.procurementEntry.updateMany({
    where: { bookItemId: { in: ids } },
    data: { bookItemId: null },
  })

  const del = await prisma.bookKitItem.deleteMany({ where: { id: { in: ids } } })
  console.log('BookKitItem deleted:', del.count)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
