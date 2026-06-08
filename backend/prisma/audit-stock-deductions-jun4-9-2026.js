require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Window of interest — orders placed on/after this date (inclusive) up to (exclusive)
const RANGE_START = new Date('2026-06-04T00:00:00+05:30')
const RANGE_END = new Date('2026-06-10T00:00:00+05:30') // covers Jun 4–9

// How close (ms) an InventoryLog entry must be to the order's createdAt to count as "matched".
// Deduction runs in the same DB transaction as order creation (ORDER_TX_OPTIONS timeout = 60s),
// so logs should land within seconds — we allow a generous 10 minute window either side.
const MATCH_WINDOW_MS = 10 * 60 * 1000

function fmt(d) {
  return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, dateStyle: 'medium', timeStyle: 'medium' })
}

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: RANGE_START, lt: RANGE_END },
      status: { not: 'CANCELLED' },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      student: { include: { class: { select: { label: true, grade: true, section: true } } } },
      branch: { select: { id: true, name: true } },
      items: true,
    },
  })

  console.log(`Found ${orders.length} non-cancelled orders between ${fmt(RANGE_START)} and ${fmt(RANGE_END)}`)

  // Pull all relevant InventoryLog OUTGOING entries in a slightly wider window for matching
  const logs = await prisma.inventoryLog.findMany({
    where: {
      changeType: 'OUTGOING',
      createdAt: {
        gte: new Date(RANGE_START.getTime() - MATCH_WINDOW_MS),
        lt: new Date(RANGE_END.getTime() + MATCH_WINDOW_MS),
      },
    },
    include: {
      bookItem: { select: { label: true } },
      uniformSize: { select: { name: true, code: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${logs.length} OUTGOING inventory log entries in the matching window\n`)

  // Track which logs get consumed so we can also report "orphan" logs (deductions with no order)
  const consumedLogIds = new Set()

  const missing = []
  const matched = []

  for (const order of orders) {
    const lines = order.items.filter(
      (it) => (it.itemType === 'BOOK' && it.bookItemId) || (it.itemType === 'UNIFORM' && it.uniformSizeId)
    )
    for (const line of lines) {
      const candidates = logs.filter((log) => {
        if (consumedLogIds.has(log.id)) return false
        if (log.branchId !== order.branchId) return false
        if (log.itemType !== line.itemType) return false
        if (line.itemType === 'BOOK' && log.bookItemId !== line.bookItemId) return false
        if (line.itemType === 'UNIFORM' && log.uniformSizeId !== line.uniformSizeId) return false
        const dt = Math.abs(new Date(log.createdAt).getTime() - new Date(order.createdAt).getTime())
        if (dt > MATCH_WINDOW_MS) return false
        // Cross-check the log notes mention this student's roll number (written by buildDistributionLogNotes)
        if (order.student?.rollNumber && log.notes && !log.notes.includes(`Roll: ${order.student.rollNumber}`)) return false
        return true
      })

      if (candidates.length > 0) {
        // Prefer the closest-in-time candidate
        candidates.sort((a, b) =>
          Math.abs(new Date(a.createdAt) - new Date(order.createdAt)) -
          Math.abs(new Date(b.createdAt) - new Date(order.createdAt))
        )
        const best = candidates[0]
        consumedLogIds.add(best.id)
        matched.push({ order, line, log: best })
      } else {
        missing.push({ order, line })
      }
    }
  }

  console.log(`\n=== MATCHED: ${matched.length} line items have a corresponding OUTGOING log ===`)
  console.log(`=== MISSING: ${missing.length} line items have NO corresponding OUTGOING log ===\n`)

  if (missing.length > 0) {
    console.log('--- MISSING DEDUCTIONS DETAIL ---')
    for (const { order, line } of missing) {
      const productName =
        line.itemType === 'BOOK'
          ? line.label
          : line.label
      console.log(
        [
          `Order ${order.orderId}`,
          `  Date/Time : ${fmt(order.createdAt)}`,
          `  Branch    : ${order.branch?.name}`,
          `  Student   : ${order.student?.name} (Roll ${order.student?.rollNumber}) — ${order.student?.class?.label} Sec ${order.student?.class?.section}`,
          `  Item      : [${line.itemType}] ${productName} x${line.quantity}`,
          `  Payment   : ${order.paymentStatus} / ${order.status}`,
          `  Item ID   : ${line.itemType === 'BOOK' ? line.bookItemId : line.uniformSizeId}`,
        ].join('\n')
      )
    }
  }

  // Orphan logs — deductions in window with no matching order line (could indicate other causes e.g. transfers, manual adjustments mislabeled)
  const orphanLogs = logs.filter((l) => !consumedLogIds.has(l.id) && l.createdAt >= RANGE_START && l.createdAt < RANGE_END)
  console.log(`\n=== ORPHAN OUTGOING LOGS (no matching order line found): ${orphanLogs.length} ===`)
  for (const log of orphanLogs) {
    const productName = log.bookItem?.label || (log.uniformSize ? `${log.uniformSize.name} (${log.uniformSize.code})` : log.id)
    console.log(
      [
        `Log ${log.id}`,
        `  Date/Time : ${fmt(log.createdAt)}`,
        `  Branch    : ${log.branch?.name}`,
        `  Item      : [${log.itemType}] ${productName}`,
        `  Delta     : ${log.quantityDelta} (before ${log.quantityBefore} -> after ${log.quantityAfter})`,
        `  Notes     : ${(log.notes || '').split('\n').join(' | ')}`,
      ].join('\n')
    )
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Orders in window           : ${orders.length}`)
  console.log(`Stock-relevant line items  : ${matched.length + missing.length}`)
  console.log(`Matched (logged correctly) : ${matched.length}`)
  console.log(`Missing (no log found)     : ${missing.length}`)
  console.log(`Orphan logs (no order)     : ${orphanLogs.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
