require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DARGA    = 'cmobxtnf90001zser4zoh709f'
const JUN4_S   = new Date('2026-06-04T00:00:00+05:30')
const JUN4_E   = new Date('2026-06-05T00:00:00+05:30')
const JUN5_S   = new Date('2026-06-05T00:00:00+05:30')
const JUN5_E   = new Date('2026-06-06T00:00:00+05:30')
const JUN6_S   = new Date('2026-06-06T00:00:00+05:30')
const JUN6_E   = new Date('2026-06-07T00:00:00+05:30')
const JUN8_S   = new Date('2026-06-08T00:00:00+05:30')
const JUN8_E   = new Date('2026-06-09T00:00:00+05:30')

async function checkDay(label, branchId, dayStart, dayEnd) {
  const orders = await prisma.order.findMany({
    where: {
      branchId,
      status: { not: 'CANCELLED' },
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      student: { include: { class: { select: { label: true, grade: true, section: true } } } },
      items: { include: { bookItem: { select: { label: true } } } },
    },
  })

  // Expand window for logs: same day ±2h
  const logWinStart = new Date(dayStart.getTime() - 2*3600_000)
  const logWinEnd   = new Date(dayEnd.getTime()   + 2*3600_000)
  const logs = await prisma.inventoryLog.findMany({
    where: { branchId, changeType: 'OUTGOING', createdAt: { gte: logWinStart, lt: logWinEnd } },
    include: { bookItem: { select: { label: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const missing = []
  const HALF_HOUR = 30 * 60 * 1000

  for (const o of orders) {
    const bookLines = o.items.filter(it => it.itemType === 'BOOK' && it.bookItemId)
    for (const line of bookLines) {
      const closeMatch = logs.find(l =>
        l.bookItemId === line.bookItemId &&
        Math.abs(new Date(l.createdAt) - new Date(o.createdAt)) < HALF_HOUR
      )
      if (!closeMatch) {
        missing.push({
          orderDate: new Date(o.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
          student: o.student?.name,
          roll: o.student?.rollNumber,
          grade: o.student?.class?.grade,
          section: o.student?.class?.section,
          orderId: o.orderId,
          paymentStatus: o.paymentStatus,
          product: line.bookItem?.label ?? '?',
          bookItemId: line.bookItemId,
        })
      }
    }
  }

  if (missing.length) {
    console.log(`\n=== ${label} | ${orders.length} orders, ${missing.length} MISSING DEDUCTIONS ===`)
    for (const m of missing) {
      console.log(`  ❌ ${m.orderDate} | ${m.orderId} | ${m.student} (${m.roll}) Grade${m.grade}-${m.section} | ${m.product} | ${m.paymentStatus}`)
    }
  } else {
    console.log(`✅ ${label} | ${orders.length} orders — all deductions present`)
  }

  return missing
}

async function main() {
  // Get all branch IDs
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  console.log('Active branches:', branches.map(b => b.name).join(', '))

  const allMissing = []
  for (const b of branches) {
    for (const [label, s, e] of [
      [`${b.name} Jun4`, JUN4_S, JUN4_E],
      [`${b.name} Jun5`, JUN5_S, JUN5_E],
      [`${b.name} Jun6`, JUN6_S, JUN6_E],
      [`${b.name} Jun8`, JUN8_S, JUN8_E],
    ]) {
      const m = await checkDay(label, b.id, s, e)
      allMissing.push(...m.map(x => ({ ...x, branch: b.name, day: label.split(' ')[1] })))
    }
  }

  // Roll-up summary
  console.log('\n\n========== GRAND TOTAL MISSING DEDUCTIONS ==========')
  console.log(`Total: ${allMissing.length} line items with no matching OUTGOING log within ±30min`)
  const byGrade = {}
  for (const m of allMissing) {
    const k = `${m.branch} ${m.day} Grade${m.grade}`
    byGrade[k] = (byGrade[k] ?? 0) + 1
  }
  for (const [k, v] of Object.entries(byGrade).sort()) {
    console.log(`  ${k}: ${v} missing`)
  }

  // Write CSV
  const rows = ['Branch,Day,OrderId,DateTime,StudentName,Roll,Grade,Section,Product,BookItemId,PaymentStatus']
  for (const m of allMissing) {
    rows.push([m.branch, m.day, m.orderId, m.orderDate, m.student, m.roll, m.grade, m.section, m.product, m.bookItemId, m.paymentStatus].map(v => `"${v ?? ''}"`).join(','))
  }
  require('fs').writeFileSync(__dirname + '/../../missing_deductions_list.csv', rows.join('\n'))
  console.log('\nCSV written to missing_deductions_list.csv')
}

main().catch(console.error).finally(() => prisma.$disconnect())
