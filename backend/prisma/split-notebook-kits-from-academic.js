/**
 * Moves notebook bundle BookKitItem rows off the ACADEMIC kit onto a dedicated NOTEBOOKS BookKit.
 * Idempotent: safe to run after prisma migrate (BookKitKind + composite unique).
 *
 * Usage: cd backend && node prisma/split-notebook-kits-from-academic.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function isNotebookCatalogKey(key) {
  return String(key ?? '').startsWith('notebooks_bundle')
}

async function main() {
  const academicKits = await prisma.bookKit.findMany({
    where: { kind: 'ACADEMIC' },
    include: {
      class: { select: { id: true, label: true, grade: true, section: true } },
      items: { where: { isArchived: false }, select: { id: true, catalogKey: true } },
    },
  })

  let movedItems = 0
  let createdKits = 0

  for (const kit of academicKits) {
    const notebookItemIds = kit.items.filter((it) => isNotebookCatalogKey(it.catalogKey)).map((it) => it.id)
    if (notebookItemIds.length === 0) continue

    let nbKit = await prisma.bookKit.findUnique({
      where: { classId_kind: { classId: kit.classId, kind: 'NOTEBOOKS' } },
    })

    if (!nbKit) {
      const labelBase = kit.class?.label ?? `Grade ${kit.class?.grade ?? ''}`
      nbKit = await prisma.bookKit.create({
        data: {
          classId: kit.classId,
          kind: 'NOTEBOOKS',
          label: `${labelBase} — Notebooks`,
          badge: 'Notebooks',
          lastUpdated: new Date(),
        },
      })
      createdKits += 1
    }

    const r = await prisma.bookKitItem.updateMany({
      where: { id: { in: notebookItemIds } },
      data: { kitId: nbKit.id },
    })
    movedItems += r.count

    await prisma.bookKit.update({
      where: { id: nbKit.id },
      data: { lastUpdated: new Date() },
    })
    await prisma.bookKit.update({
      where: { id: kit.id },
      data: { lastUpdated: new Date() },
    })
  }

  console.log(`split-notebook-kits-from-academic: created ${createdKits} NOTEBOOKS kit(s), moved ${movedItems} item row(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
