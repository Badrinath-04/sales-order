/**
 * restore-workbooks-textbooks.js
 *
 * Restores (un-archives) all textbook & workbook BookKitItems and reorders
 * kit items so UI shows:
 *   1) Workbooks (top)
 *   2) Textbooks (next)
 *   3) Notebooks (last) — the dedicated `catalogKey="notebooks_bundle"` remains last
 *
 * This is idempotent and safe to run multiple times.
 *
 * Usage:
 *   cd backend
 *   node prisma/restore-workbooks-textbooks.js
 */

'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function norm(s) {
  return String(s ?? '').toLowerCase()
}

function classify(label) {
  const l = norm(label)
  if (l.includes('workbook')) return 'WORKBOOK'
  if (l.includes('textbook')) return 'TEXTBOOK'
  if (l.includes('notebook')) return 'NOTEBOOK'
  return 'OTHER'
}

async function main() {
  console.log('Restoring workbooks & textbooks and reordering kit items…')

  const items = await prisma.bookKitItem.findMany({
    select: { id: true, label: true, kitId: true, catalogKey: true, isArchived: true, position: true },
  })

  // Group by kit to set relative ordering consistently inside each kit
  const byKit = new Map()
  for (const it of items) {
    if (!byKit.has(it.kitId)) byKit.set(it.kitId, [])
    byKit.get(it.kitId).push(it)
  }

  let unarchivedWorkbooks = 0
  let unarchivedTextbooks = 0
  let movedNotebooksBundle = 0
  let reorderedOther = 0

  for (const [kitId, kitItems] of byKit.entries()) {
    // Stable ordering buckets
    const workbooks = []
    const textbooks = []
    const notebooksBundle = []
    const others = []

    for (const it of kitItems) {
      if (it.catalogKey === 'notebooks_bundle') {
        notebooksBundle.push(it)
        continue
      }
      const kind = classify(it.label)
      if (kind === 'WORKBOOK') workbooks.push(it)
      else if (kind === 'TEXTBOOK') textbooks.push(it)
      else others.push(it)
    }

    // Assign positions: workbooks 0.., textbooks 100.., others 200.., notebooks_bundle 999
    // (Large gaps minimize future collisions with manual reordering.)
    const updates = []

    for (let i = 0; i < workbooks.length; i++) {
      const it = workbooks[i]
      const nextPos = 0 + i
      const nextArchived = false
      if (it.isArchived) unarchivedWorkbooks += 1
      updates.push(prisma.bookKitItem.update({
        where: { id: it.id },
        data: { isArchived: nextArchived, position: nextPos },
      }))
    }

    for (let i = 0; i < textbooks.length; i++) {
      const it = textbooks[i]
      const nextPos = 100 + i
      const nextArchived = false
      if (it.isArchived) unarchivedTextbooks += 1
      updates.push(prisma.bookKitItem.update({
        where: { id: it.id },
        data: { isArchived: nextArchived, position: nextPos },
      }))
    }

    for (let i = 0; i < others.length; i++) {
      const it = others[i]
      // Keep archived state for "other" items as-is; just push them below textbooks.
      const nextPos = 200 + i
      if (it.position !== nextPos) reorderedOther += 1
      updates.push(prisma.bookKitItem.update({
        where: { id: it.id },
        data: { position: nextPos },
      }))
    }

    for (const it of notebooksBundle) {
      if (it.position !== 999) movedNotebooksBundle += 1
      updates.push(prisma.bookKitItem.update({
        where: { id: it.id },
        data: { isArchived: false, position: 999 },
      }))
    }

    // Run per-kit updates in a transaction to keep ordering consistent
    if (updates.length) {
      await prisma.$transaction(updates, { timeout: 60_000, maxWait: 15_000 })
    }
  }

  console.log(`✓ Unarchived workbooks: ${unarchivedWorkbooks}`)
  console.log(`✓ Unarchived textbooks: ${unarchivedTextbooks}`)
  console.log(`✓ Moved notebooks bundle to bottom: ${movedNotebooksBundle}`)
  console.log(`✓ Reordered other kit items: ${reorderedOther}`)
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error('[ERROR]', e?.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

