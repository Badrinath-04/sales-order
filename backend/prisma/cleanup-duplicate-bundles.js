/**
 * cleanup-duplicate-bundles.js
 *
 * Cleans up duplicate bundle items created for the same class kit.
 * Keeps exactly one item per (kitId, catalogKey) and archives the rest.
 *
 * Also archives notebook bundle rows for non-'A' sections (since config is class-wise).
 *
 * Usage:
 *   cd backend
 *   node prisma/cleanup-duplicate-bundles.js
 */

'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning duplicate bundles…')

  // 1) Archive notebooks_bundle for non-A sections
  const nonA = await prisma.bookKitItem.updateMany({
    where: { catalogKey: 'notebooks_bundle', kit: { class: { section: { not: 'A' } } } },
    data: { isArchived: true },
  })
  console.log(`✓ Archived notebooks_bundle for non-A sections: ${nonA.count}`)

  // 2) For each kitId+catalogKey, keep one (lowest id) and archive others
  const keys = await prisma.bookKitItem.findMany({
    where: { catalogKey: { not: null } },
    select: { id: true, kitId: true, catalogKey: true, isArchived: true },
    orderBy: [{ kitId: 'asc' }, { catalogKey: 'asc' }, { id: 'asc' }],
  })

  const seen = new Set()
  const toArchive = []
  for (const row of keys) {
    const k = `${row.kitId}:${row.catalogKey}`
    if (!seen.has(k)) {
      seen.add(k)
      continue
    }
    if (!row.isArchived) toArchive.push(row.id)
  }

  if (toArchive.length) {
    const r = await prisma.bookKitItem.updateMany({
      where: { id: { in: toArchive } },
      data: { isArchived: true },
    })
    console.log(`✓ Archived duplicate catalogKey items: ${r.count}`)
  } else {
    console.log('✓ No duplicate catalogKey items found')
  }
}

main()
  .catch((e) => {
    console.error('[ERROR]', e?.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

