require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const branches = await p.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } })

  for (const b of branches) {
    const classes = await p.academicClass.findMany({
      where: { branchId: b.id, grade: { gte: -2, lte: 10 } },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      include: {
        bookKits: { select: { id: true, kind: true } },
      },
    })

    // Group by grade
    const byGrade = {}
    for (const c of classes) {
      const g = c.grade
      if (!byGrade[g]) byGrade[g] = []
      const kinds = c.bookKits.map(k => k.kind)
      byGrade[g].push({ section: c.section, classId: c.id, kinds })
    }

    console.log(`\n=== ${b.name} ===`)
    for (const [grade, sections] of Object.entries(byGrade).sort((a,b) => Number(a[0])-Number(b[0]))) {
      const hasIssue = sections.some(s => s.section === 'A' && !s.kinds.includes('ACADEMIC'))
        && sections.some(s => s.kinds.includes('ACADEMIC'))
      const flag = hasIssue ? ' ⚠️ SEC-A MISSING ACADEMIC!' : ''
      console.log(`  Grade ${grade}:${flag}`)
      for (const s of sections) {
        console.log(`    Section ${s.section}: [${s.kinds.join(', ') || 'NO KIT'}]${s.section === 'A' ? ' ← resolvedClass picks this' : ''}`)
      }
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect())
