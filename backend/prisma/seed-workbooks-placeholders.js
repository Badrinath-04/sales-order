/**
 * seed-workbooks-placeholders.js
 *
 * Creates a configurable Workbooks bundle for each grade (-2..10) for section 'A' kits,
 * across all active branches. This ensures the Orders page always shows a Workbooks
 * item (at the top), even if actual workbook configuration is not yet present.
 *
 * - catalogKey: "workbooks_bundle"
 * - label: "Workbooks"
 * - productType: SET
 * - setPrice: 0 (editable in UI)
 * - position: 0 (top)
 *
 * Idempotent: uses createProduct upsert semantics via direct upsert per kit+catalogKey.
 *
 * Usage:
 *   cd backend
 *   node prisma/seed-workbooks-placeholders.js
 */

'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const GRADES = Array.from({ length: 13 }, (_, i) => i - 2) // -2..10

async function main() {
  console.log('Seeding Workbooks placeholders for section A kits…')

  const branches = await prisma.branch.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true },
  })

  let created = 0
  let updated = 0

  for (const grade of GRADES) {
    const classes = await prisma.academicClass.findMany({
      where: { grade, section: 'A', branchId: { in: branches.map((b) => b.id) } },
      select: {
        id: true,
        branchId: true,
        bookKits: { where: { kind: 'ACADEMIC' }, take: 1, select: { id: true } },
      },
    })

    for (const cls of classes) {
      const kitId = cls.bookKits[0]?.id
      if (!kitId) continue

      const existing = await prisma.bookKitItem.findFirst({
        where: { kitId, catalogKey: 'workbooks_bundle' },
      })

      if (existing) {
        await prisma.bookKitItem.update({
          where: { id: existing.id },
          data: {
            isArchived: false,
            label: 'Workbooks',
            icon: 'edit_note',
            price: 0,
            setPrice: 0,
            productType: 'SET',
            position: 0,
          },
        })
        updated += 1
      } else {
        await prisma.bookKitItem.create({
          data: {
            kitId,
            catalogKey: 'workbooks_bundle',
            label: 'Workbooks',
            icon: 'edit_note',
            price: 0,
            setPrice: 0,
            productType: 'SET',
            position: 0,
            isArchived: false,
          },
        })
        created += 1
      }
    }
  }

  console.log(`✓ Workbooks placeholders: created=${created}, updated=${updated}`)
}

main()
  .catch((e) => {
    console.error('[ERROR]', e?.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

