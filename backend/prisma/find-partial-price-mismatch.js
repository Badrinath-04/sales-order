require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const START = new Date('2026-06-04T00:00:00+05:30')
  const END   = new Date('2026-06-09T00:00:00+05:30')

  const orders = await p.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      bookStatus: 'PARTIAL',
      createdAt: { gte: START, lt: END },
    },
    include: {
      items: {
        include: {
          bookItem: { select: { label: true, price: true } },
        },
      },
      student: {
        include: {
          class: {
            select: {
              label: true,
              grade: true,
              section: true,
              bookKits: {
                include: {
                  items: {
                    where: { isArchived: false },
                    select: { id: true, label: true, price: true, setPrice: true },
                  },
                },
              },
            },
          },
        },
      },
      branch: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const mismatches = []

  for (const o of orders) {
    const itemSum = o.items.reduce((s, it) => s + Number(it.totalPrice), 0)
    const orderTotal = Number(o.total)
    const gap = orderTotal - itemSum

    if (gap > 100) {
      const t = new Date(o.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short',
      })
      const bookItems = o.items.filter(it => it.itemType === 'BOOK')
      const orderedBookIds = new Set(bookItems.map(it => it.bookItemId).filter(Boolean))
      const kitItems = (o.student?.class?.bookKits ?? []).flatMap(k => k.items)
      const missingKitItems = kitItems.filter(ki => !orderedBookIds.has(ki.id))

      mismatches.push({ order: o, gap, t, bookItems, missingKitItems })

      console.log(`❌ ${o.orderId} | ${t} | ${o.branch?.name} | ${o.student?.name} (${o.student?.rollNumber}) | ${o.student?.class?.label}`)
      console.log(`   Charged: ₹${orderTotal} | Items recorded: ₹${itemSum.toFixed(0)} | GAP: ₹${gap.toFixed(0)}`)
      console.log(`   Recorded: ${bookItems.map(it => it.label + '=₹' + it.totalPrice).join(', ') || 'no book items'}`)
      if (missingKitItems.length) {
        console.log(`   Missing from order: ${missingKitItems.map(ki => `${ki.label} [id:${ki.id.slice(-8)}] price=₹${ki.price}`).join(', ')}`)
      } else {
        console.log(`   Note: gap exists but kit items all present — may be setPrice/discount case`)
      }
    }
  }

  console.log(`\nTotal affected orders: ${mismatches.length}`)

  // Summary by branch/date
  const byBranchDate = {}
  for (const { order: o, gap } of mismatches) {
    const day = new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' })
    const k = `${o.branch?.name} ${day}`
    if (!byBranchDate[k]) byBranchDate[k] = { count: 0, totalGap: 0 }
    byBranchDate[k].count++
    byBranchDate[k].totalGap += gap
  }
  console.log('\nBy branch/date:')
  for (const [k, v] of Object.entries(byBranchDate)) {
    console.log(`  ${k}: ${v.count} orders, total unrecorded value ₹${v.totalGap.toFixed(0)}`)
  }
}

main().catch(console.error).finally(() => p.$disconnect())
