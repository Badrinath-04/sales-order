/**
 * set-all-stock-80.js
 *
 * Sets stock to 80 units for ALL branches across ALL products:
 *  - Books: BookStock (per BookKitItem per Branch)
 *  - Uniforms: UniformStock (per UniformSize per Branch)
 *  - Accessories: AccessoryStock (per Accessory per Branch)
 *
 * Idempotent: safe to run multiple times.
 * Does NOT touch:
 *  - reserved quantities
 *  - student/order/transaction data
 *  - pricing or kit configuration
 *
 * Usage:
 *   cd backend
 *   node prisma/set-all-stock-80.js
 */

'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TARGET_QTY = 80

function toneForQty(qty) {
  // Keep it simple: 80 is well above thresholds, so NORMAL.
  return 'NORMAL'
}

async function main() {
  console.log(`Setting all stock quantities to ${TARGET_QTY} for all branches/products…`)

  const branches = await prisma.branch.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, code: true },
  })
  console.log(`Branches: ${branches.map((b) => b.name).join(', ')}`)

  // ── Fast path: bulk update existing rows first ────────────────────────────
  // Books
  const updBooks = await prisma.bookStock.updateMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    data: { quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) },
  })
  // Uniforms
  const updUniforms = await prisma.uniformStock.updateMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    data: { quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) },
  })
  // Accessories
  const updAccessories = await prisma.accessoryStock.updateMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    data: { quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) },
  })

  console.log(`✓ Updated existing stock rows → books:${updBooks.count}, uniforms:${updUniforms.count}, accessories:${updAccessories.count}`)

  // ── Ensure missing rows exist (createMany + skipDuplicates) ───────────────
  // Books: create any missing (BookKitItem × Branch)
  const bookItems = await prisma.bookKitItem.findMany({ select: { id: true } })
  const existingBookStock = await prisma.bookStock.findMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    select: { itemId: true, branchId: true },
  })
  const existingBookKey = new Set(existingBookStock.map((r) => `${r.itemId}:${r.branchId}`))
  const bookCreates = []
  for (const it of bookItems) {
    for (const br of branches) {
      const key = `${it.id}:${br.id}`
      if (existingBookKey.has(key)) continue
      bookCreates.push({ itemId: it.id, branchId: br.id, quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) })
    }
  }
  if (bookCreates.length) {
    await prisma.bookStock.createMany({ data: bookCreates, skipDuplicates: true })
  }
  console.log(`✓ Books: ensured missing rows → created:${bookCreates.length}`)

  // ── Uniforms (UniformSize × Branch) ───────────────────────────────────────
  const uniformSizes = await prisma.uniformSize.findMany({ select: { id: true } })
  const existingUniformStock = await prisma.uniformStock.findMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    select: { sizeId: true, branchId: true },
  })
  const existingUniformKey = new Set(existingUniformStock.map((r) => `${r.sizeId}:${r.branchId}`))
  const uniformCreates = []
  for (const sz of uniformSizes) {
    for (const br of branches) {
      const key = `${sz.id}:${br.id}`
      if (existingUniformKey.has(key)) continue
      uniformCreates.push({ sizeId: sz.id, branchId: br.id, quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) })
    }
  }
  if (uniformCreates.length) {
    await prisma.uniformStock.createMany({ data: uniformCreates, skipDuplicates: true })
  }
  console.log(`✓ Uniforms: ensured missing rows → created:${uniformCreates.length}`)

  // ── Accessories (Accessory × Branch) ──────────────────────────────────────
  const accessories = await prisma.accessory.findMany({ select: { id: true } })
  const existingAccessoryStock = await prisma.accessoryStock.findMany({
    where: { branchId: { in: branches.map((b) => b.id) } },
    select: { accessoryId: true, branchId: true },
  })
  const existingAccessoryKey = new Set(existingAccessoryStock.map((r) => `${r.accessoryId}:${r.branchId}`))
  const accessoryCreates = []
  for (const acc of accessories) {
    for (const br of branches) {
      const key = `${acc.id}:${br.id}`
      if (existingAccessoryKey.has(key)) continue
      accessoryCreates.push({ accessoryId: acc.id, branchId: br.id, quantity: TARGET_QTY, tone: toneForQty(TARGET_QTY) })
    }
  }
  if (accessoryCreates.length) {
    await prisma.accessoryStock.createMany({ data: accessoryCreates, skipDuplicates: true })
  }
  console.log(`✓ Accessories: ensured missing rows → created:${accessoryCreates.length}`)

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error('[ERROR]', e?.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

