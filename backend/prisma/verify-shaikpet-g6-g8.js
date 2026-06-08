require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const IST = { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }

async function checkGrade(branchName, grade, productLabel) {
  // Find branch
  const branch = await p.branch.findFirst({ where: { name: { contains: branchName }, isActive: true } })
  if (!branch) { console.log(`Branch "${branchName}" not found`); return }

  // Find all non-cancelled orders for this grade at this branch
  const orders = await p.order.findMany({
    where: {
      branchId: branch.id,
      status: { not: 'CANCELLED' },
      student: { class: { grade } },
    },
    include: {
      items: { include: { bookItem: { select: { id: true, label: true } } } },
      student: { include: { class: { select: { grade: true, section: true, label: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Filter orders that have the target product
  const relevant = orders.filter(o =>
    o.items.some(it => it.bookItem?.label?.toLowerCase().includes(productLabel.toLowerCase()))
  )

  console.log(`\n=== ${branchName} Grade ${grade} — "${productLabel}" ===`)
  console.log(`Orders with product: ${relevant.length}`)

  // Collect all unique bookItemIds for this product
  const bookItemIds = new Set()
  for (const o of relevant) {
    for (const it of o.items) {
      if (it.bookItem?.label?.toLowerCase().includes(productLabel.toLowerCase())) {
        bookItemIds.add(it.bookItem.id)
      }
    }
  }
  console.log(`BookItem IDs used: ${[...bookItemIds].join(', ')}`)

  // Get all OUTGOING logs for these bookItemIds at this branch
  const logs = await p.inventoryLog.findMany({
    where: {
      branchId: branch.id,
      changeType: 'OUTGOING',
      bookItemId: { in: [...bookItemIds] },
    },
    include: { bookItem: { select: { label: true } } },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`OUTGOING log entries: ${logs.length}`)
  console.log(`Gap: ${relevant.length - logs.length} (${relevant.length > logs.length ? '❌ MISSING' : '✅'})`)

  if (relevant.length !== logs.length) {
    // Cross-match: for each order, check if a log exists near its timestamp (±5 min)
    console.log('\nPer-order breakdown:')
    const WINDOW = 5 * 60 * 1000
    for (const o of relevant) {
      const t = new Date(o.createdAt)
      const tStr = t.toLocaleString('en-IN', IST)
      for (const it of o.items.filter(i => i.bookItem?.label?.toLowerCase().includes(productLabel.toLowerCase()))) {
        const match = logs.find(l =>
          l.bookItemId === it.bookItem.id &&
          Math.abs(new Date(l.createdAt) - t) < WINDOW
        )
        const symbol = match ? '✅' : '❌ MISSING LOG'
        console.log(`  ${symbol} | ${tStr} | ${o.orderId} | ${o.student?.name} | ${o.student?.class?.label}`)
      }
    }

    // Also show orphan logs (log exists but no matching order)
    console.log('\nAll log timestamps:')
    for (const l of logs) {
      console.log(`  ${new Date(l.createdAt).toLocaleString('en-IN', IST)} | ${l.bookItem?.label} | delta:${l.quantityDelta} | ${(l.notes ?? '').split('\n')[0]}`)
    }
  }
}

async function main() {
  await checkGrade('Shaikpet', 6, 'textbook')      // Grade 6 Shaikpet – textbook bundle
  await checkGrade('Shaikpet', 6, 'workbook')      // Grade 6 Shaikpet – workbook bundle (if exists)
  await checkGrade('Shaikpet', 8, 'workbook')      // Grade 8 Shaikpet – workbook bundle
}

main().catch(console.error).finally(() => p.$disconnect())
