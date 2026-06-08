/**
 * Corrects 51 orders where the Textbook Bundle was charged (correct total)
 * but never saved as an OrderItem, resulting in missing stock deductions.
 *
 * For each affected order this script:
 *  1. Adds the missing OrderItem (Textbook Bundle) row
 *  2. Decrements BookStock by 1 at the correct branch
 *  3. Creates a corrective InventoryLog (OUTGOING) entry
 *
 * Run on dev DB first, verify, then repeat on production.
 * ⚠️  DO NOT RUN until the audit report has been reviewed.
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry-run')

async function buildMissingItemMap() {
  // For each grade+branch, find the Textbook Bundle bookItemId used in CORRECT orders
  // (orders where bookStatus = TAKEN and items include a Textbook Bundle)
  const correctOrders = await p.order.findMany({
    where: {
      bookStatus: { in: ['TAKEN', 'PARTIAL'] },
      status: { not: 'CANCELLED' },
      createdAt: { gte: new Date('2026-05-01T00:00:00+05:30') },
    },
    include: {
      items: { where: { itemType: 'BOOK' }, include: { bookItem: { select: { label: true } } } },
      student: { include: { class: { select: { grade: true, section: true } } } },
      branch: { select: { id: true, name: true } },
    },
  })

  // grade+branchId → { textbookItemId, label, section }
  const map = new Map()
  for (const o of correctOrders) {
    const tbItem = o.items.find(it => it.bookItemId && it.bookItem?.label?.toLowerCase().includes('textbook'))
    if (!tbItem) continue
    const grade = o.student?.class?.grade
    const branchId = o.branchId
    const key = `${grade}:${branchId}`
    if (!map.has(key)) {
      map.set(key, {
        bookItemId: tbItem.bookItemId,
        label: tbItem.bookItem?.label ?? 'Textbook Bundle',
        unitPrice: Number(tbItem.unitPrice),
        totalPrice: Number(tbItem.totalPrice),
      })
    }
  }
  return map
}

async function main() {
  const START = new Date('2026-06-04T00:00:00+05:30')
  const END   = new Date('2026-06-09T00:00:00+05:30')

  const affectedOrders = await p.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      bookStatus: 'PARTIAL',
      createdAt: { gte: START, lt: END },
    },
    include: {
      items: { include: { bookItem: { select: { label: true } } } },
      student: { include: { class: { select: { label: true, grade: true, section: true } } } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Filter to orders where total is significantly higher than item sum (missing items)
  const mismatched = affectedOrders.filter(o => {
    const itemSum = o.items.reduce((s, it) => s + Number(it.totalPrice), 0)
    return (Number(o.total) - itemSum) > 100
  })

  console.log(`Found ${mismatched.length} orders with price gap (missing Textbook Bundle items)`)

  const itemMap = await buildMissingItemMap()
  console.log(`Built reference map for ${itemMap.size} grade+branch combinations`)

  const superAdmin = await p.user.findFirst({ where: { role: 'SUPER_ADMIN' } })

  let fixedCount = 0
  let skippedCount = 0

  for (const o of mismatched) {
    const grade = o.student?.class?.grade
    const branchId = o.branchId
    const branchName = o.branch?.name
    const key = `${grade}:${branchId}`
    const ref = itemMap.get(key)

    const itemSum = o.items.reduce((s, it) => s + Number(it.totalPrice), 0)
    const gap = Number(o.total) - itemSum
    const t = new Date(o.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short',
    })

    if (!ref) {
      console.log(`⚠️  SKIP ${o.orderId} | ${o.student?.name} | Grade${grade} | No reference bookItemId found for this grade+branch`)
      skippedCount++
      continue
    }

    // Check if Textbook Bundle OrderItem already exists (prevent double-fix)
    const alreadyHasTB = o.items.some(it => it.bookItemId === ref.bookItemId)
    if (alreadyHasTB) {
      console.log(`⏭️  SKIP ${o.orderId} | Textbook Bundle already in items`)
      skippedCount++
      continue
    }

    const missingLabel = ref.label
    const unitPrice = gap // use the actual gap as the unit price (reflects what was charged)

    if (DRY_RUN) {
      console.log(`[DRY] Would fix ${o.orderId} | ${t} | ${branchName} | ${o.student?.name} (${o.student?.rollNumber}) | ${o.student?.class?.label} | +${missingLabel} ₹${unitPrice.toFixed(0)}`)
      fixedCount++
      continue
    }

    try {
      await p.$transaction(async (tx) => {
        // 1. Add missing OrderItem
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            studentId: o.student?.id ?? undefined,
            itemType: 'BOOK',
            bookItemId: ref.bookItemId,
            label: `${missingLabel} (Audit Correction)`,
            quantity: 1,
            unitPrice: unitPrice,
            totalPrice: unitPrice,
          },
        })

        // 2. Decrement BookStock
        const stock = await tx.bookStock.findUnique({
          where: { itemId_branchId: { itemId: ref.bookItemId, branchId } },
        })
        const before = stock?.quantity ?? 0
        const after = Math.max(0, before - 1)

        await tx.bookStock.upsert({
          where: { itemId_branchId: { itemId: ref.bookItemId, branchId } },
          create: { itemId: ref.bookItemId, branchId, quantity: after },
          update: { quantity: after },
        })

        // 3. Add InventoryLog
        const student = o.student
        const classLabel = student?.class?.label ?? '—'
        const section = student?.class?.section ?? '—'
        const rollNumber = student?.rollNumber ?? '—'
        const studentName = student?.name ?? '—'

        await tx.inventoryLog.create({
          data: {
            branchId,
            itemType: 'BOOK',
            bookItemId: ref.bookItemId,
            changeType: 'OUTGOING',
            quantityBefore: before,
            quantityAfter: after,
            quantityDelta: after - before,
            performedById: superAdmin.id,
            // Use original order timestamp so logs reflect when the kit was actually issued
            createdAt: o.createdAt,
            notes: [
              'Audit Correction',
              `Missing order item restored for Order ${o.orderId}`,
              `Original order date: ${t}`,
              `Student: ${studentName}`,
              `Roll: ${rollNumber}`,
              `Class: ${classLabel} Section ${section}`,
              `Branch: ${branchName}`,
              `Product: ${missingLabel}`,
              'Quantity: -1',
            ].join('\n'),
          },
        })
      })

      console.log(`✅ Fixed ${o.orderId} | ${t} | ${branchName} | ${o.student?.name} | ${o.student?.class?.label} | +${missingLabel} ₹${unitPrice.toFixed(0)}`)
      fixedCount++
    } catch (err) {
      console.error(`❌ ERROR on ${o.orderId}: ${err.message}`)
    }
  }

  console.log(`\nDone. Fixed: ${fixedCount}, Skipped: ${skippedCount}`)
}

main().catch(console.error).finally(() => p.$disconnect())
