/**
 * Close orders cleared via discount notes but left PARTIAL in DB.
 *
 * Dry run:  node prisma/correct-cleared-dues-4509-7335.js
 * Apply:    APPLY_DUE_CORRECTION=1 node prisma/correct-cleared-dues-4509-7335.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const { computeOrderDue } = require('../src/utils/orderDue')

const prisma = new PrismaClient()
const APPLY = process.env.APPLY_DUE_CORRECTION === '1'

const TARGETS = [
  { orderId: '#SKM-2026-4509', studentName: 'G. Likitha' },
  { orderId: '#SKM-2026-7335', studentName: 'Rajasingh.new.' },
]

function money(value) {
  return Number(value ?? 0)
}

async function loadOrder(orderId) {
  return prisma.order.findUnique({
    where: { orderId },
    include: {
      student: { select: { name: true } },
      transactions: { orderBy: { createdAt: 'asc' } },
    },
  })
}

async function correctOrder(order) {
  const { effectiveTotal, dueAmount, discountAmount } = computeOrderDue(order)
  if (dueAmount > 0.009) {
    throw new Error(`${order.orderId} still has ₹${dueAmount.toFixed(2)} due after discount parsing`)
  }

  const paidAmount = money(order.paidAmount)
  const newTotal = effectiveTotal
  const lastPaidAt = [...order.transactions]
    .reverse()
    .find((tx) => tx.paymentMethod !== 'CREDIT' && money(tx.amount) > 0)?.paidAt

  console.log(`  discount recognized: ₹${discountAmount.toFixed(2)}`)
  console.log(`  total ${money(order.total)} -> ${newTotal}`)
  console.log(`  paidAmount: ${paidAmount}`)
  console.log(`  paymentStatus: ${order.paymentStatus} -> PAID`)

  if (!APPLY) return

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        total: newTotal,
        paidAmount,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        paidAt: lastPaidAt ?? new Date(),
        notes: order.notes
          ? order.notes
          : discountAmount > 0
            ? `Discount Applied: ₹${discountAmount.toFixed(2)}`
            : undefined,
        updatedAt: new Date(),
      },
    })

    for (const transaction of order.transactions) {
      if (transaction.paymentMethod === 'CREDIT') continue
      if (transaction.status === 'PAID') continue
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID' },
      })
    }
  })
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`)
  for (const target of TARGETS) {
    const order = await loadOrder(target.orderId)
    if (!order) throw new Error(`Order ${target.orderId} not found`)
    if (order.student?.name !== target.studentName) {
      throw new Error(`Student mismatch for ${target.orderId}: ${order.student?.name}`)
    }

    console.log(`\n${order.orderId} (${order.student.name})`)
    await correctOrder(order)
  }

  if (!APPLY) {
    console.log('\nDry run passed. Re-run with APPLY_DUE_CORRECTION=1 to commit.')
    return
  }

  console.log('\nPost-check:')
  for (const target of TARGETS) {
    const order = await loadOrder(target.orderId)
    const { dueAmount } = computeOrderDue(order)
    console.log(
      `- ${order.orderId}: status=${order.paymentStatus}, total=${money(order.total)}, paid=${money(order.paidAmount)}, due=${dueAmount}`,
    )
  }
  console.log('\nDone.')
}

main()
  .catch((err) => {
    console.error('FAILED:', err.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
