/**
 * delete-main-warehouse.js
 *
 * Completely removes the "Main Warehouse" branch and ALL data scoped to it:
 *   - BookStock, UniformStock, AccessoryStock
 *   - InventoryLog
 *   - OrderItems (via Order cascade), Orders, Transactions
 *   - AcademicClasses → Students, BookKits → BookKitItems → BookKitSubItems
 *   - StockTransfers → StockTransferItems
 *   - ProcurementEntries
 *   - Users assigned to this branch
 *   - The Branch row itself
 *
 * The 3 school branches (Darga, Narsingi, Shaikpet) are NOT touched.
 *
 * Usage:  cd backend && node prisma/delete-main-warehouse.js
 */

'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PROTECTED_CODES = ['CAMP-A', 'CAMP-B', 'CAMP-C']   // Darga / Narsingi / Shaikpet

async function main() {
  // ── 1. Locate the branch ──────────────────────────────────────────────────
  const branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { name: { contains: 'Main Warehouse', mode: 'insensitive' } },
        { name: { contains: 'Main', mode: 'insensitive' } },
        { name: { contains: 'Warehouse', mode: 'insensitive' } },
      ],
      code: { notIn: PROTECTED_CODES },
    },
  })

  if (!branch) {
    console.log('No "Main Warehouse" branch found. Nothing to delete.')
    return
  }

  if (PROTECTED_CODES.includes(branch.code)) {
    console.error(`SAFETY: Branch "${branch.name}" (${branch.code}) is a protected school branch. Aborting.`)
    process.exit(1)
  }

  const branchId = branch.id
  console.log(`\nTarget branch: "${branch.name}" (id: ${branchId}, code: ${branch.code})`)
  console.log('='.repeat(60))

  // ── 2. Inventory stock ────────────────────────────────────────────────────
  const bsCount = await prisma.bookStock.count({ where: { branchId } })
  const usCount = await prisma.uniformStock.count({ where: { branchId } })
  const asCount = await prisma.accessoryStock.count({ where: { branchId } })
  console.log(`Stock records: ${bsCount} book, ${usCount} uniform, ${asCount} accessory`)

  await prisma.bookStock.deleteMany({ where: { branchId } })
  await prisma.uniformStock.deleteMany({ where: { branchId } })
  await prisma.accessoryStock.deleteMany({ where: { branchId } })
  console.log('✓ Stock records deleted')

  // ── 3. Inventory logs ─────────────────────────────────────────────────────
  const logCount = await prisma.inventoryLog.count({ where: { branchId } })
  console.log(`Inventory logs: ${logCount}`)
  await prisma.inventoryLog.deleteMany({ where: { branchId } })
  console.log('✓ Inventory logs deleted')

  // ── 4. Procurement entries ────────────────────────────────────────────────
  const procCount = await prisma.procurementEntry.count({ where: { branchId } })
  console.log(`Procurement entries: ${procCount}`)
  await prisma.procurementEntry.deleteMany({ where: { branchId } })
  console.log('✓ Procurement entries deleted')

  // ── 5. Orders + OrderItems + Transactions ─────────────────────────────────
  const orderCount = await prisma.order.count({ where: { branchId } })
  console.log(`Orders: ${orderCount}`)

  // Delete transactions for orders in this branch
  const txnCount = await prisma.transaction.count({ where: { branchId } })
  console.log(`Transactions: ${txnCount}`)
  await prisma.transaction.deleteMany({ where: { branchId } })

  // OrderItems are cascade-deleted when Order is deleted (onDelete: Cascade)
  await prisma.order.deleteMany({ where: { branchId } })
  console.log('✓ Orders, order items, and transactions deleted')

  // ── 6. Stock transfers (from or to this branch) ───────────────────────────
  const tfCount = await prisma.stockTransfer.count({
    where: { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] },
  })
  console.log(`Stock transfers: ${tfCount}`)
  // StockTransferItems are cascade-deleted when StockTransfer is deleted
  await prisma.stockTransfer.deleteMany({
    where: { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] },
  })
  console.log('✓ Stock transfers deleted')

  // ── 7. Students (via AcademicClass) ───────────────────────────────────────
  const classes = await prisma.academicClass.findMany({
    where: { branchId },
    include: {
      bookKit: { include: { items: { include: { subItems: true } } } },
    },
  })
  console.log(`Academic classes: ${classes.length}`)

  for (const cls of classes) {
    if (cls.bookKit) {
      // BookKitSubItems → BookKitItems → BookKit
      for (const item of cls.bookKit.items) {
        await prisma.bookKitSubItem.deleteMany({ where: { kitItemId: item.id } })
        // Nullify any remaining bookItemId FKs that other tables might still hold
        // (Orders already deleted above; ProcurementEntries already deleted)
      }
      await prisma.bookKitItem.deleteMany({ where: { kitId: cls.bookKit.id } })
      await prisma.bookKit.delete({ where: { id: cls.bookKit.id } })
    }

    // Students' OrderItems FKs are already gone (orders deleted). Delete students.
    await prisma.students.deleteMany({ where: { classId: cls.id } })
  }

  await prisma.academicClass.deleteMany({ where: { branchId } })
  console.log('✓ Students, book kits, and academic classes deleted')

  // ── 8. Users assigned to this branch ─────────────────────────────────────
  const userCount = await prisma.user.count({ where: { branchId } })
  console.log(`Users assigned to this branch: ${userCount}`)
  if (userCount > 0) {
    // Remove refresh tokens first (FK constraint)
    const userIds = (await prisma.user.findMany({ where: { branchId }, select: { id: true } }))
      .map((u) => u.id)
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { branchId } })
  }
  console.log('✓ Branch users deleted')

  // ── 9. Delete the branch itself ───────────────────────────────────────────
  await prisma.branch.delete({ where: { id: branchId } })
  console.log(`\n✓ Branch "${branch.name}" fully deleted.\n`)

  // ── Confirm remaining branches ────────────────────────────────────────────
  const remaining = await prisma.branch.findMany({
    select: { name: true, code: true, isActive: true },
    orderBy: { name: 'asc' },
  })
  console.log('Remaining branches:')
  remaining.forEach((b) => console.log(`  • ${b.name} (${b.code}) ${b.isActive ? '✓ active' : '(inactive)'}`) )
}

main()
  .catch((e) => { console.error('\n[ERROR]', e.message ?? e); process.exit(1) })
  .finally(() => prisma.$disconnect())
