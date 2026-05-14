/**
 * reset-and-seed-notebooks.js
 *
 * PART 1 — Archives existing **notebook bundle** kit items (catalogKey notebooks_bundle*)
 *         and resets stock only for those items.
 * PART 2 — Seeds the canonical notebook bundles on the dedicated NOTEBOOKS `BookKit`
 *         for every grade across all branches (section A; UI merges sections).
 *
 * Safe to run multiple times (idempotent via catalogKey + NOTEBOOKS kit).
 * Does NOT touch: uniform data, student records, orders, transaction history,
 *                 or academic (textbook/workbook) kit items.
 *
 * Prerequisites: run Prisma migration `20260515120000_book_kit_kind_split` so each class
 * has ACADEMIC + NOTEBOOKS kits. For legacy DBs, run `npm run db:split-notebook-kits` once.
 *
 * Usage:
 *   cd backend
 *   node prisma/reset-and-seed-notebooks.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// ─── Notebook bundle definitions per grade ────────────────────────────────────
// grade: Prisma AcademicClass.grade value (-2=Nursery, -1=LKG, 0=UKG, 1-10=Class 1-10)
// Shared bundles cover multiple grades (same bundle applied to each grade in the list).
// Unit price: ₹33 per notebook. Bundle totals already rounded to nearest ₹5 multiple.

const NOTEBOOK_BUNDLES = [
  {
    grades: [-2],              // Nursery
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 132,
    notebooks: [
      { label: 'Four Rule', quantity: 2, price: 33 },
      { label: 'Big Check Rule', quantity: 2, price: 33 },
    ],
  },
  {
    grades: [-1],              // LKG
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 165,
    notebooks: [
      { label: 'Four Rule', quantity: 3, price: 33 },
      { label: 'Small Check Rule', quantity: 2, price: 33 },
    ],
  },
  {
    grades: [0],               // UKG
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 264,
    notebooks: [
      { label: 'Four Rule', quantity: 4, price: 33 },
      { label: 'Small Check Rule', quantity: 2, price: 33 },
      { label: 'Double Rule', quantity: 2, price: 33 },
    ],
  },
  {
    grades: [1, 2],            // Class 1 & 2 (shared)
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 462,
    notebooks: [
      { label: 'Four Rule', quantity: 8, price: 33 },
      { label: 'Double Rule', quantity: 4, price: 33 },
      { label: 'Maths Ruled Book', quantity: 2, price: 33 },
    ],
  },
  {
    grades: [3],               // Class 3
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 462,
    notebooks: [
      { label: 'Double Rule', quantity: 4, price: 33 },
      { label: 'Four Rule', quantity: 6, price: 33 },
      { label: 'Maths Ruled Book', quantity: 2, price: 33 },
      { label: 'One Side Rule', quantity: 2, price: 33 },
    ],
  },
  {
    grades: [4, 5],            // Class 4 & 5 (shared)
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 495,
    notebooks: [
      { label: 'Double Rule', quantity: 4, price: 33 },
      { label: 'Four Rule', quantity: 2, price: 33 },
      { label: 'Maths Ruled Book', quantity: 3, price: 33 },
      { label: 'One Side Rule', quantity: 2, price: 33 },
      { label: 'Single Ruled', quantity: 4, price: 33 },
    ],
  },
  {
    grades: [6, 7],            // Class 6 & 7 — Long notebooks, 200 pages
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 528,
    notebooks: [
      { label: 'Single Ruled', quantity: 10, price: 33 },
      { label: 'Plain', quantity: 3, price: 33 },
      { label: 'One Side', quantity: 2, price: 33 },
      { label: 'Four Rule', quantity: 1, price: 33 },
    ],
  },
  {
    grades: [8, 9],            // Class 8 & 9 — Long plain books
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 627,
    notebooks: [
      { label: 'Long Books Plain', quantity: 18, price: 33 },
      { label: 'Four Rule', quantity: 1, price: 33 },
    ],
  },
  {
    grades: [10],              // Class 10 — Long plain books, 300 pages
    label: 'Notebook Bundle',
    badge: 'Notebooks',
    setPrice: 594,
    notebooks: [
      { label: '300 Pages Plain', quantity: 18, price: 33 },
    ],
  },
]

// Build a quick grade → bundle lookup map
const BUNDLE_BY_GRADE = new Map()
for (const bundle of NOTEBOOK_BUNDLES) {
  for (const grade of bundle.grades) {
    BUNDLE_BY_GRADE.set(grade, bundle)
  }
}

const STOCK_PER_BUNDLE = 500  // generous initial stock; adjust via Stock Management UI

// ─── PART 1 — Archive existing book kit items & zero out stock ────────────────

async function resetExistingBookData() {
  console.log('\n[PART 1] Archiving existing notebook bundle kit items and resetting their stock…')

  const archiveResult = await prisma.bookKitItem.updateMany({
    where: { isArchived: false, catalogKey: { startsWith: 'notebooks_bundle' } },
    data: { isArchived: true },
  })
  console.log(`  → Archived ${archiveResult.count} notebook bundle kit item(s)`)

  const notebookItemIds = (
    await prisma.bookKitItem.findMany({
      where: { catalogKey: { startsWith: 'notebooks_bundle' } },
      select: { id: true },
    })
  ).map((r) => r.id)

  if (notebookItemIds.length) {
    const resetResult = await prisma.bookStock.updateMany({
      where: { itemId: { in: notebookItemIds } },
      data: { quantity: 0, tone: 'NORMAL' },
    })
    console.log(`  → Reset ${resetResult.count} book stock row(s) tied to notebook bundles`)
  }

  console.log('[PART 1] Done.')
}

// ─── PART 2 — Seed notebook bundles ──────────────────────────────────────────

async function seedNotebookBundles() {
  console.log('\n[PART 2] Seeding notebook bundles for all branches and grades…')

  // Fetch all active branches
  const branches = await prisma.branch.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, code: true },
  })
  console.log(`  Found ${branches.length} active branch(es): ${branches.map((b) => b.name).join(', ')}`)

  // Fetch all academic classes that have a valid grade.
  // BUSINESS RULE: Stock/config is class-wise (per grade), not section-wise.
  // Seed notebooks only for section 'A' kits; UI merges across sections.
  const classes = await prisma.academicClass.findMany({
    where: { grade: { gte: -2, lte: 10 }, section: 'A' },
    orderBy: [{ grade: 'asc' }, { section: 'asc' }],
  })
  console.log(`  Found ${classes.length} academic class record(s)`)

  let kitItemsCreated = 0
  let stockRecordsUpserted = 0

  for (const cls of classes) {
    const bundleDef = BUNDLE_BY_GRADE.get(cls.grade)
    if (!bundleDef) continue

    await prisma.bookKit.upsert({
      where: { classId_kind: { classId: cls.id, kind: 'ACADEMIC' } },
      update: {},
      create: {
        classId: cls.id,
        kind: 'ACADEMIC',
        label: `${cls.label ?? `Grade ${cls.grade}`} Kit Details`,
        badge: 'Academic Kit',
        lastUpdated: new Date(),
      },
    })

    const notebookKit = await prisma.bookKit.upsert({
      where: { classId_kind: { classId: cls.id, kind: 'NOTEBOOKS' } },
      update: {
        label: `${cls.label ?? `Grade ${cls.grade}`} — Notebooks`,
        badge: 'Notebooks',
        lastUpdated: new Date(),
      },
      create: {
        classId: cls.id,
        kind: 'NOTEBOOKS',
        label: `${cls.label ?? `Grade ${cls.grade}`} — Notebooks`,
        badge: 'Notebooks',
        lastUpdated: new Date(),
      },
    })

    const kitId = notebookKit.id

    // Check whether a notebook bundle already exists for this NOTEBOOKS kit (idempotent)
    const existing = await prisma.bookKitItem.findFirst({
      where: { kitId, catalogKey: 'notebooks_bundle', isArchived: false },
    })

    let bundleItemId

    if (existing) {
      // Update the existing bundle item in case prices / setPrice changed
      await prisma.bookKitItem.update({
        where: { id: existing.id },
        data: {
          label: bundleDef.label,
          price: 33,
          setPrice: bundleDef.setPrice,
          productType: 'SET',
          position: 10,
        },
      })
      bundleItemId = existing.id

      // Delete old sub-items so they get re-created cleanly
      await prisma.bookKitSubItem.deleteMany({ where: { kitItemId: bundleItemId } })
    } else {
      // Create new notebook bundle item
      const created = await prisma.bookKitItem.create({
        data: {
          kitId,
          catalogKey: 'notebooks_bundle',
          label: bundleDef.label,
          icon: 'library_books',
          price: 33,
          setPrice: bundleDef.setPrice,
          productType: 'SET',
          position: 10,
          isArchived: false,
        },
      })
      bundleItemId = created.id
      kitItemsCreated += 1
    }

    // Create sub-items (one per notebook type)
    for (let i = 0; i < bundleDef.notebooks.length; i++) {
      const nb = bundleDef.notebooks[i]
      await prisma.bookKitSubItem.create({
        data: {
          kitItemId: bundleItemId,
          label: nb.label,
          price: nb.price,
          quantity: nb.quantity,
          position: i,
          isActive: true,
        },
      })
    }

    // Seed stock: 500 units per bundle item per branch (idempotent upsert)
    for (const branch of branches) {
      await prisma.bookStock.upsert({
        where: { itemId_branchId: { itemId: bundleItemId, branchId: branch.id } },
        update: { quantity: STOCK_PER_BUNDLE, tone: 'NORMAL' },
        create: { itemId: bundleItemId, branchId: branch.id, quantity: STOCK_PER_BUNDLE, tone: 'NORMAL' },
      })
      stockRecordsUpserted += 1
    }
  }

  console.log(`  → Created/updated ${kitItemsCreated} new notebook bundle kit item(s)`)
  console.log(`  → Upserted ${stockRecordsUpserted} stock record(s) at ${STOCK_PER_BUNDLE} units each`)
  console.log('[PART 2] Done.')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log(' Notebook Reset + Seed Script')
  console.log('='.repeat(60))

  await resetExistingBookData()
  await seedNotebookBundles()

  console.log('\n' + '='.repeat(60))
  console.log(' All done. Run "npm run dev" in the backend to verify.')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('\n[ERROR]', e.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
