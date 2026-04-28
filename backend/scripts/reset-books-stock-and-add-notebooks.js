/**
 * One-off: zero all book stock for classes grade -2..10, then add a single
 * catalog-linked notebook product (VARIANT) with opening qty 1000 per branch per kit.
 *
 * Run from repo: node backend/scripts/reset-books-stock-and-add-notebooks.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }
const OPENING_NOTES = 'Opening Entry'

function calcTone(qty, threshold = 50) {
  if (qty <= threshold * 0.2) return 'CRITICAL'
  if (qty <= threshold) return 'LOW'
  return 'NORMAL'
}

async function main() {
  const actor =
    (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      orderBy: { createdAt: 'asc' },
    })) ||
    (await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    }))

  if (!actor) {
    console.error('No user found — cannot write inventory logs for new stock.')
    process.exit(1)
  }

  const bookStockWhere = {
    item: {
      kit: {
        class: { grade: SUPPORTED_CLASS_GRADE },
      },
    },
  }

  const zeroed = await prisma.bookStock.updateMany({
    where: bookStockWhere,
    data: { quantity: 0, tone: calcTone(0) },
  })
  console.log('Book stock rows zeroed:', zeroed.count)

  const label = 'Notebooks — 200 pages (Set of 20)'
  const existing = await prisma.bookKitItem.findFirst({ where: { label } })
  if (existing) {
    console.log('Notebook product already exists (same label); skipping kit creates.')
    return
  }

  const catalogKey = randomUUID()
  const price = 700
  const productType = 'VARIANT'
  const openingQty = 1000
  const icon = 'menu_book'

  let kitsCreated = 0

  // Avoid one huge interactive transaction (default timeout → P2028).
  for (let grade = SUPPORTED_CLASS_GRADE.gte; grade <= SUPPORTED_CLASS_GRADE.lte; grade++) {
    const classes = await prisma.academicClass.findMany({
      where: { grade, section: 'A' },
      select: { id: true, branchId: true, bookKit: { select: { id: true } } },
      orderBy: { branchId: 'asc' },
    })
    const targets = classes
      .filter((c) => c.bookKit?.id)
      .map((c) => ({ kitId: c.bookKit.id, branchId: c.branchId }))

    for (const target of targets) {
      const maxAgg = await prisma.bookKitItem.aggregate({
        where: { kitId: target.kitId },
        _max: { position: true },
      })
      const position = (maxAgg._max.position ?? -1) + 1

      const item = await prisma.bookKitItem.create({
        data: {
          kitId: target.kitId,
          catalogKey,
          label,
          icon,
          price,
          setPrice: null,
          productType,
          position,
        },
      })

      await prisma.bookStock.create({
        data: {
          itemId: item.id,
          branchId: target.branchId,
          quantity: openingQty,
          tone: calcTone(openingQty),
        },
      })

      await prisma.inventoryLog.create({
        data: {
          branchId: target.branchId,
          itemType: 'BOOK',
          bookItemId: item.id,
          changeType: 'ADJUSTMENT',
          quantityBefore: 0,
          quantityAfter: openingQty,
          quantityDelta: openingQty,
          performedById: actor.id,
          notes: OPENING_NOTES,
        },
      })

      kitsCreated++
    }
  }

  console.log('Notebook kit rows created (per class kit × branch):', kitsCreated)
  console.log('Shared catalogKey:', catalogKey)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
