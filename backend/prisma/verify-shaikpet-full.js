require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

const IST = { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }

async function checkGrade(branchName, grade) {
  const branch = await p.branch.findFirst({ where: { name: { contains: branchName }, isActive: true } })

  const orders = await p.order.findMany({
    where: { branchId: branch.id, status: { not: 'CANCELLED' }, student: { class: { grade } } },
    include: {
      items: { include: { bookItem: { select: { label: true } } } },
      student: { include: { class: { select: { label: true, section: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\n=== ${branchName} Grade ${grade} — ${orders.length} total orders ===`)
  console.log('Student                     | Section | Textbook | Workbook | Notebook | Date')
  console.log('-'.repeat(90))

  for (const o of orders) {
    const items = o.items.map(it => it.bookItem?.label?.toLowerCase() ?? '')
    const hasTB = items.some(l => l.includes('textbook')) ? '✅' : '❌'
    const hasWB = items.some(l => l.includes('workbook')) ? '✅' : '  '
    const hasNB = items.some(l => l.includes('notebook')) ? '✅' : '❌'
    const t = new Date(o.createdAt).toLocaleString('en-IN', IST)
    const sec = o.student?.class?.section ?? '?'
    console.log(`${(o.student?.name ?? '?').padEnd(28)} | ${sec.padEnd(7)} | ${hasTB}      | ${hasWB}      | ${hasNB}      | ${t}`)
  }

  // Summary
  const withTB = orders.filter(o => o.items.some(it => it.bookItem?.label?.toLowerCase().includes('textbook')))
  const withWB = orders.filter(o => o.items.some(it => it.bookItem?.label?.toLowerCase().includes('workbook')))
  const withNB = orders.filter(o => o.items.some(it => it.bookItem?.label?.toLowerCase().includes('notebook')))
  console.log(`\nSummary: Textbook=${withTB.length} | Workbook=${withWB.length} | Notebook=${withNB.length} | Total orders=${orders.length}`)

  const missingWB = orders.filter(o => !o.items.some(it => it.bookItem?.label?.toLowerCase().includes('workbook')))
  if (missingWB.length) {
    console.log(`Students WITHOUT workbook bundle (${missingWB.length}):`)
    for (const o of missingWB) {
      const itemLabels = o.items.map(it => it.bookItem?.label ?? it.label ?? '?').join(', ')
      console.log(`  • ${o.student?.name} (${o.student?.class?.label}) — items: ${itemLabels || 'none'}`)
    }
  }
}

async function main() {
  await checkGrade('Shaikpet', 6)
  await checkGrade('Shaikpet', 8)
}

main().catch(console.error).finally(() => p.$disconnect())
