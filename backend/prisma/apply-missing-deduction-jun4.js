/**
 * Applies the single missing stock deduction identified in stock_audit_report.md
 *
 * Order  : #SKM-2026-4543
 * Student: Harsha Vardini.K (CAMP-A-9-C-003) — Class 9-C Sec C
 * Branch : Darga
 * Item   : Textbook Bundle (Full Bundle) — bookItemId: cmp5xrc750035j7iabtj0id6e
 * Date   : 4 Jun 2026, 1:38:46 PM IST (original order time)
 *
 * ⚠️  DO NOT RUN until stock_audit_report.md has been reviewed and approved.
 *     Run on dev DB first, verify, then repeat on production.
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const BOOK_ITEM_ID = 'cmp5xrc750035j7iabtj0id6e' // Textbook Bundle (Class 9-C)
const BRANCH_ID = 'cmobxtnf90001zser4zoh709f'   // Darga
const ORDER_ID = '#SKM-2026-4543'

async function main() {
  // 1. Verify pre-conditions
  const stock = await prisma.bookStock.findUnique({
    where: { itemId_branchId: { itemId: BOOK_ITEM_ID, branchId: BRANCH_ID } },
    include: { item: { select: { label: true } }, branch: { select: { name: true } } },
  })
  if (!stock) {
    console.error('ERROR: BookStock row not found — aborting.')
    process.exit(1)
  }
  console.log(`Pre-fix stock: ${stock.branch.name} / ${stock.item.label} = ${stock.quantity}`)

  const existingLog = await prisma.inventoryLog.findFirst({
    where: { bookItemId: BOOK_ITEM_ID, branchId: BRANCH_ID, changeType: 'OUTGOING' },
  })
  if (existingLog) {
    console.error('ERROR: An OUTGOING log already exists for this item — no correction needed. Aborting.')
    process.exit(1)
  }

  // 2. Run correction inside a transaction
  const before = stock.quantity
  const after = Math.max(0, before - 1)

  // Fetch original order timestamp to use as log createdAt
  const originalOrder = await prisma.order.findFirst({ where: { orderId: ORDER_ID } })
  const originalCreatedAt = originalOrder?.createdAt ?? new Date('2026-06-04T08:08:46.743Z')

  await prisma.$transaction(async (tx) => {
    await tx.bookStock.update({
      where: { itemId_branchId: { itemId: BOOK_ITEM_ID, branchId: BRANCH_ID } },
      data: { quantity: after },
    })

    await tx.inventoryLog.create({
      data: {
        branchId: BRANCH_ID,
        itemType: 'BOOK',
        bookItemId: BOOK_ITEM_ID,
        changeType: 'OUTGOING',
        quantityBefore: before,
        quantityAfter: after,
        quantityDelta: after - before,
        performedById: (await tx.user.findFirst({ where: { role: 'SUPER_ADMIN' } })).id,
        // Use original order timestamp so log reflects when the kit was actually issued
        createdAt: originalCreatedAt,
        notes: [
          'Audit Correction',
          'Deduction missed on original order date 4 Jun 2026 1:38:46 PM',
          `Order: ${ORDER_ID}`,
          'Student: Harsha Vardini.K',
          'Roll: CAMP-A-9-C-003',
          'Class: Class 9-C Section C',
          'Branch: Darga',
          'Product: Textbook Bundle (Full Bundle)',
          'Quantity: -1',
        ].join('\n'),
      },
    })
  })

  // 3. Verify post-condition
  const updated = await prisma.bookStock.findUnique({
    where: { itemId_branchId: { itemId: BOOK_ITEM_ID, branchId: BRANCH_ID } },
  })
  console.log(`Post-fix stock: ${updated.quantity}`)
  console.log(`✅ Done — stock corrected from ${before} → ${after}. Correction log created.`)
}

main()
  .catch((e) => {
    console.error('FAILED:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
