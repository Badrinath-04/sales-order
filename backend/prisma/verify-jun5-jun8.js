require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  for (const [label, s, e] of [
    ['Jun 5', new Date('2026-06-05T00:00:00+05:30'), new Date('2026-06-06T00:00:00+05:30')],
    ['Jun 8', new Date('2026-06-08T00:00:00+05:30'), new Date('2026-06-09T00:00:00+05:30')],
  ]) {
    const orders = await p.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        bookStatus: 'PARTIAL',
        createdAt: { gte: s, lt: e },
      },
      include: { items: true, student: { include: { class: { select: { label: true, grade: true } } } }, branch: { select: { name: true } } },
    })

    const bad = orders.filter(o => {
      const itemSum = o.items.reduce((sum, it) => sum + Number(it.totalPrice), 0)
      return Number(o.total) - itemSum > 100
    })

    console.log(`\n=== ${label} ===`)
    console.log(`PARTIAL orders: ${orders.length}, with price gap >₹100: ${bad.length}`)

    if (bad.length === 0) {
      console.log('✅ Clean — no missing bundle items')
    } else {
      for (const o of bad) {
        const gap = Number(o.total) - o.items.reduce((sum, it) => sum + Number(it.totalPrice), 0)
        const t = new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
        console.log(`  ❌ ${o.orderId} | ${t} | ${o.branch?.name} | ${o.student?.name} | ${o.student?.class?.label} | gap: ₹${gap.toFixed(0)}`)
      }
    }

    // Also breakdown by branch
    const byBranch = {}
    for (const o of orders) {
      const bn = o.branch?.name ?? '?'
      byBranch[bn] = (byBranch[bn] ?? 0) + 1
    }
    console.log('  By branch:', Object.entries(byBranch).map(([k, v]) => `${k}:${v}`).join(', '))
  }
}

main().catch(console.error).finally(() => p.$disconnect())
