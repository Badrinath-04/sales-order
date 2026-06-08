require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const BRANCH_ALIASES = ['SVN_NARSINGI', 'CAMP-B', 'NARSINGI']
const ROLLBACK_MARKER = 'ROLLBACK_UNIFORM_SMOKE_TESTS'

const TESTS = [
  { name: 'Tie only', items: [['Tie', 'ONE']], expectedTotal: 80 },
  { name: 'Belt only', items: [['Belt', 'ONE']], expectedTotal: 100 },
  { name: 'Tie + Belt', items: [['Tie', 'ONE'], ['Belt', 'ONE']], expectedTotal: 180 },
  { name: 'T-Shirt size 28', items: [['T-Shirt', '28']], expectedTotal: 410 },
  { name: 'Pant 30 + T-Shirt 26', items: [['Pant', '30'], ['T-Shirt', '26']], expectedTotal: 610 },
  { name: 'Full girls set', items: [['T-Shirt', '28'], ['Skirt', '28'], ['Tie', 'ONE'], ['Belt', 'ONE'], ['Socks', 'M']], expectedTotal: 1005 },
  { name: 'Shorts + Socks S + Belt', items: [['Shorts', '15'], ['Socks', 'S'], ['Belt', 'ONE']], expectedTotal: 430 },
  { name: 'Full boys set', items: [['T-Shirt', '28'], ['Pant', '30'], ['Tie', 'ONE'], ['Belt', 'ONE'], ['Socks', 'L']], expectedTotal: 870 },
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function money(value) {
  return Number(value).toFixed(2)
}

function orderId(index) {
  return `#SMOKE-UNIFORM-${Date.now()}-${index}`
}

function logNotes(student, branch, productName) {
  return [
    'Distribution',
    `Student: ${student.name}`,
    `Roll: ${student.rollNumber}`,
    `Class: ${student.class.label} Section ${student.class.section}`,
    `Branch: ${branch.name}`,
    `Product: ${productName}`,
    'Quantity: -1',
  ].join('\n')
}

async function findSmokeBranch(tx) {
  const branch = await tx.branch.findFirst({
    where: {
      OR: [
        { code: { in: BRANCH_ALIASES } },
        { name: { contains: 'narsingi', mode: 'insensitive' } },
      ],
      isActive: true,
      deletedAt: null,
      type: 'BRANCH',
    },
  })
  if (!branch) throw new Error('Smoke branch not found. Expected SVN Narsingi / CAMP-B.')
  return branch
}

async function findSmokeStudent(tx, branchId) {
  const student = await tx.students.findFirst({
    where: {
      isActive: true,
      class: { branchId },
    },
    include: { class: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!student) throw new Error('No active student found in the smoke branch.')
  return student
}

async function loadUniformMap(tx) {
  const sizes = await tx.uniformSize.findMany({
    include: { category: true },
  })
  const map = new Map()
  for (const size of sizes) {
    map.set(`${size.category.label.toLowerCase()}:${size.code}`, size)
  }
  return map
}

async function getStock(tx, branchId, sizeId) {
  const stock = await tx.uniformStock.findUnique({
    where: { sizeId_branchId: { sizeId, branchId } },
  })
  return Number(stock?.quantity ?? 0)
}

async function runSmokeTest(tx, { test, index, branch, student, admin, uniformMap, runningExpectedStock }) {
  const orderItems = []
  const beforeBySize = new Map()
  const logCountBefore = await tx.inventoryLog.count({
    where: { branchId: branch.id, itemType: 'UNIFORM', changeType: 'OUTGOING' },
  })

  for (const [categoryLabel, code] of test.items) {
    const size = uniformMap.get(`${categoryLabel.toLowerCase()}:${code}`)
    assert(size, `${test.name}: missing ${categoryLabel} ${code}`)

    const before = await getStock(tx, branch.id, size.id)
    const expectedBefore = runningExpectedStock.get(size.id) ?? before
    assert(before === expectedBefore, `${test.name}: ${categoryLabel} ${code} stock did not carry forward. Expected ${expectedBefore}, got ${before}.`)
    assert(before > 0, `${test.name}: ${categoryLabel} ${code} has no stock to deduct.`)
    beforeBySize.set(size.id, before)

    const unitPrice = Number(size.price)
    orderItems.push({
      size,
      label: `${size.category.label} (${size.code})`,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
    })
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  assert(subtotal === test.expectedTotal, `${test.name}: expected total ${test.expectedTotal}, got ${subtotal}`)

  const order = await tx.order.create({
    data: {
      orderId: orderId(index),
      studentId: student.id,
      branchId: branch.id,
      createdById: admin.id,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      bookStatus: 'NOT_TAKEN',
      uniformStatus: 'COMPLETE',
      subtotal,
      administrativeFee: 0,
      total: subtotal,
      paidAmount: subtotal,
      paidAt: new Date(),
      notes: `Uniform smoke test: ${test.name}`,
      items: {
        create: orderItems.map((item) => ({
          itemType: 'UNIFORM',
          uniformSizeId: item.size.id,
          label: item.label,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
    },
    include: { items: true },
  })

  await tx.transaction.create({
    data: {
      orderId: order.id,
      branchId: branch.id,
      amount: subtotal,
      paymentMethod: 'CASH',
      status: 'PAID',
      notes: `Uniform smoke test payment: ${test.name}`,
      paidAt: new Date(),
    },
  })

  for (const item of orderItems) {
    const before = beforeBySize.get(item.size.id)
    const after = before - 1
    await tx.uniformStock.update({
      where: { sizeId_branchId: { sizeId: item.size.id, branchId: branch.id } },
      data: { quantity: after, tone: after <= 4 ? 'CRITICAL' : after <= 20 ? 'LOW' : 'NORMAL' },
    })
    await tx.inventoryLog.create({
      data: {
        branchId: branch.id,
        itemType: 'UNIFORM',
        uniformSizeId: item.size.id,
        changeType: 'OUTGOING',
        quantityBefore: before,
        quantityAfter: after,
        quantityDelta: -1,
        performedById: admin.id,
        notes: logNotes(student, branch, item.label),
      },
    })
    runningExpectedStock.set(item.size.id, after)

    const actualAfter = await getStock(tx, branch.id, item.size.id)
    assert(actualAfter === after, `${test.name}: ${item.label} expected stock ${after}, got ${actualAfter}`)
  }

  const logCountAfter = await tx.inventoryLog.count({
    where: {
      branchId: branch.id,
      itemType: 'UNIFORM',
      changeType: 'OUTGOING',
    },
  })
  const logDelta = logCountAfter - logCountBefore
  assert(logDelta === orderItems.length, `${test.name}: expected ${orderItems.length} stock logs, got ${logDelta}`)

  console.log(`✓ ${test.name}: ₹${money(subtotal)}, ${orderItems.length} item(s), stock/logs verified`)
}

async function main() {
  console.log('Running uniform order smoke tests in a rollback-only transaction...')
  try {
    await prisma.$transaction(async (tx) => {
      const branch = await findSmokeBranch(tx)
      const student = await findSmokeStudent(tx, branch.id)
      const admin = await tx.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } })
      if (!admin) throw new Error('Active Super Admin user not found.')
      const uniformMap = await loadUniformMap(tx)
      const runningExpectedStock = new Map()

      for (let index = 0; index < TESTS.length; index += 1) {
        await runSmokeTest(tx, {
          test: TESTS[index],
          index,
          branch,
          student,
          admin,
          uniformMap,
          runningExpectedStock,
        })
      }

      throw new Error(ROLLBACK_MARKER)
    }, { maxWait: 15_000, timeout: 60_000 })
  } catch (err) {
    if (err?.message === ROLLBACK_MARKER) {
      console.log('✓ Rollback complete. Smoke orders, logs, payments, and stock deductions were not persisted.')
      return
    }
    throw err
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
