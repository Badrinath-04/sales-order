/**
 * Credit transaction smoke test — dev DB via API + Prisma assertions.
 * Run: node prisma/smoke-credit-transactions.js
 * Cleanup marker: SMOKE_CREDIT_TXN_TEST
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const {
  computeOrderDue,
  isPureCreditDueOrder,
  isOrderFullySettled,
} = require('../src/utils/orderDue')

const prisma = new PrismaClient()
const API = `http://localhost:${process.env.PORT || 4000}/api`
const MARKER = 'SMOKE_CREDIT_TXN_TEST'
const BRANCH_NAMES = ['Darga', 'Narsingi', 'Shaikpet']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const results = []
let token = null

function todayRange() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() }
}

function assertCase(name, condition, detail = '') {
  const pass = Boolean(condition)
  results.push({ name, pass, detail })
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) throw new Error(`Assertion failed: ${name} — ${detail}`)
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function login() {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: { username: 'superadmin', password: 'NHSBooks@26' },
  })
  const t = data?.data?.token ?? data?.data?.accessToken
  if (status !== 200 || !t) throw new Error(`Login failed: ${JSON.stringify(data)}`)
  token = t
}

async function cleanup() {
  const orders = await prisma.order.findMany({
    where: { notes: { contains: MARKER } },
    select: { id: true, orderId: true },
  })
  for (const o of orders) {
    await prisma.transaction.deleteMany({ where: { orderId: o.id } })
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } })
    await prisma.inventoryLog.deleteMany({ where: { notes: { contains: o.orderId } } })
    await prisma.order.delete({ where: { id: o.id } })
  }
  if (orders.length) console.log(`Cleaned ${orders.length} prior smoke order(s).`)
}

async function loadBranchContext(branchName) {
  const branch = await prisma.branch.findFirst({
    where: { name: branchName, isActive: true, deletedAt: null },
  })
  if (!branch) throw new Error(`Branch ${branchName} not found`)

  const students = await prisma.students.findMany({
    where: {
      isActive: true,
      class: { branchId: branch.id, grade: 2 },
      orders: { none: { notes: { contains: MARKER } } },
    },
    include: { class: true },
    orderBy: { rollNumber: 'asc' },
    take: 15,
  })
  if (students.length < 3) throw new Error(`Need 3+ grade-2 students in ${branchName}`)

  const cls = await prisma.academicClass.findFirst({
    where: { branchId: branch.id, grade: 2 },
    include: {
      bookKits: {
        include: {
          items: {
            where: { isArchived: false },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  })
  const notebookKit = cls?.bookKits?.find((k) => k.kind === 'NOTEBOOKS')
  const notebookBundle = notebookKit?.items?.find((i) => /notebook/i.test(i.label)) ?? notebookKit?.items?.[0]
  if (!notebookBundle) throw new Error(`Notebook bundle missing for ${branchName}`)

  const unitPrice = Number(notebookBundle.setPrice ?? notebookBundle.price)
  const items = [{
    itemType: 'BOOK',
    itemId: notebookBundle.id,
    label: notebookBundle.label,
    quantity: 1,
    unitPrice,
  }]

  const stock = await prisma.bookStock.findUnique({
    where: { itemId_branchId: { itemId: notebookBundle.id, branchId: branch.id } },
  })

  return { branch, students, items, unitPrice, stockQty: Number(stock?.quantity ?? 0), notebookBundle }
}

async function createOrder(branch, student, items, total, label) {
  let last = null
  for (let attempt = 1; attempt <= 8; attempt++) {
    if (attempt > 1) await sleep(400 * attempt)
    const res = await api('/orders', {
      method: 'POST',
      body: {
        studentId: student.id,
        branchId: branch.id,
        items,
        totalAmount: total,
        notes: `${MARKER} — ${label}`,
      },
    })
    last = res
    if (res.status === 201) return res.data?.data?.order ?? res.data?.order
  }
  throw new Error(`Create order failed (${last?.status}): ${JSON.stringify(last?.data)}`)
}

async function pay(orderPk, amount, paymentMethod, extra = {}) {
  const { status, data } = await api(`/orders/${orderPk}/payment`, {
    method: 'POST',
    body: { amount, paymentMethod, ...extra },
  })
  if (status !== 200) throw new Error(`Payment failed (${status}): ${JSON.stringify(data)}`)
  return data?.data?.order ?? data?.order
}

async function fetchKpis(branchId, range = {}) {
  const qs = new URLSearchParams({ branchId, limit: '100', ...range })
  const { status, data } = await api(`/transactions/kpis?${qs}`)
  if (status !== 200) throw new Error(`KPI fetch failed: ${JSON.stringify(data)}`)
  return data?.data ?? data
}

async function fetchDues(branchId, range = {}) {
  const qs = new URLSearchParams({ branchId, limit: '100', page: '1', ...range })
  const { status, data } = await api(`/transactions/dues?${qs}`)
  if (status !== 200) throw new Error(`Dues fetch failed: ${JSON.stringify(data)}`)
  const payload = data?.data ?? data
  const rows = Array.isArray(payload) ? payload : (payload?.data ?? [])
  const meta = data?.meta ?? {}
  return { rows, meta }
}

async function loadOrder(orderId) {
  return prisma.order.findUnique({
    where: { orderId },
    include: { transactions: { orderBy: { createdAt: 'asc' } }, items: true },
  })
}

async function computeExpectedOutstandingCredit(branchId, range = {}) {
  const orders = await prisma.order.findMany({
    where: {
      branchId,
      status: { not: 'CANCELLED' },
      paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
      paidAmount: { equals: 0 },
    },
    select: {
      total: true,
      paidAmount: true,
      notes: true,
      paymentStatus: true,
      createdAt: true,
      transactions: { select: { paymentMethod: true, paidAt: true, createdAt: true, notes: true } },
    },
  })
  const { dateFrom, dateTo } = range
  const { creditOrderMatchesDateRange } = require('../src/utils/orderDue')
  return orders
    .filter((o) => isPureCreditDueOrder(o))
    .filter((o) => creditOrderMatchesDateRange(o, dateFrom, dateTo))
    .reduce((s, o) => s + computeOrderDue(o).dueAmount, 0)
}

async function runBranchScenarios(ctx, studentOffset = 0) {
  const { branch, students, items, unitPrice, stockQty, notebookBundle } = ctx
  const [sFull, sSplit, sClear] = students.slice(studentOffset, studentOffset + 3)
  const today = todayRange()
  const total = unitPrice

  console.log(`\n━━━ ${branch.name} (notebook ₹${total}, stock before: ${stockQty}) ━━━`)

  const kpisBeforeToday = await fetchKpis(branch.id, today)
  const kpisBeforeAll = await fetchKpis(branch.id, {})

  // Case 1: Full credit
  const o1 = await createOrder(branch, sFull, items, total, `${branch.name} full credit`)
  assertCase(`${branch.name} — order created DRAFT`, o1.status === 'DRAFT' && o1.paymentStatus === 'UNPAID', o1.orderId)

  const stockAfterCreate = await prisma.bookStock.findUnique({
    where: { itemId_branchId: { itemId: notebookBundle.id, branchId: branch.id } },
  })
  assertCase(
    `${branch.name} — stock deducted on create`,
    Number(stockAfterCreate.quantity) === stockQty - 1,
    `${stockQty} → ${stockAfterCreate.quantity}`,
  )

  const paid1 = await pay(o1.id, total, 'CREDIT', { notes: 'Full credit smoke' })
  assertCase(`${branch.name} — full credit payment`, paid1.paymentMethod === 'CREDIT' && Number(paid1.paidAmount) === 0)
  const order1 = await loadOrder(paid1.orderId)
  assertCase(`${branch.name} — CREDIT txn exists`, order1.transactions.some((t) => t.paymentMethod === 'CREDIT'))
  assertCase(`${branch.name} — pure credit due`, isPureCreditDueOrder(order1) && computeOrderDue(order1).dueAmount === total)

  const kpisAfterCreditToday = await fetchKpis(branch.id, today)
  const expectedCreditToday = await computeExpectedOutstandingCredit(branch.id, today)
  assertCase(
    `${branch.name} — today outstanding credit KPI`,
    Math.abs(Number(kpisAfterCreditToday.creditReceived) - expectedCreditToday) < 0.02,
    `API ₹${kpisAfterCreditToday.creditReceived} expected ₹${expectedCreditToday}`,
  )
  assertCase(
    `${branch.name} — today revenue excludes credit`,
    Number(kpisAfterCreditToday.revenueToday) === Number(kpisAfterCreditToday.cashReceived) + Number(kpisAfterCreditToday.onlineReceived),
  )

  const duesAfterCredit = await fetchDues(branch.id, {})
  const dueRow1 = duesAfterCredit.rows.find((r) => r.orderId === paid1.orderId)
  assertCase(`${branch.name} — on due list`, Boolean(dueRow1), paid1.orderId)
  assertCase(
    `${branch.name} — due list credit meta`,
    Number(duesAfterCredit.meta.totalCreditDue) >= total,
    `totalCreditDue ₹${duesAfterCredit.meta.totalCreditDue}`,
  )

  // Case 2: Split cash + credit (e.g. 3000 cash if total >= 5000, else half)
  const cashPart = total >= 5000 ? 3000 : Math.floor(total / 2)
  const creditPart = total - cashPart
  const o2 = await createOrder(branch, sSplit, items, total, `${branch.name} split cash+credit`)
  await pay(o2.id, cashPart, 'CASH')
  const paid2 = await pay(o2.id, creditPart, 'CREDIT', { notes: 'Split credit smoke' })
  const order2 = await loadOrder(paid2.orderId)
  assertCase(`${branch.name} — split paid cash`, Number(order2.paidAmount) === cashPart)
  assertCase(`${branch.name} — split still has due`, computeOrderDue(order2).dueAmount === creditPart)
  assertCase(`${branch.name} — split NOT pure credit KPI`, !isPureCreditDueOrder(order2))

  const duesSplit = await fetchDues(branch.id, {})
  const dueRow2 = duesSplit.rows.find((r) => r.orderId === paid2.orderId)
  assertCase(`${branch.name} — split on pending due`, Boolean(dueRow2) && Number(dueRow2.dueAmount) === creditPart)

  // Case 3: Full credit then clear same day via UPI
  const o3 = await createOrder(branch, sClear, items, total, `${branch.name} credit clear same-day`)
  await pay(o3.id, total, 'CREDIT')
  const kpisBeforeClear = await fetchKpis(branch.id, today)
  const cleared = await pay(o3.id, total, 'UPI_BHARATH', { notes: 'Same-day clear smoke' })
  assertCase(`${branch.name} — same-day clear PAID`, cleared.paymentStatus === 'PAID')
  assertCase(`${branch.name} — same-day clear settled`, isOrderFullySettled(cleared))

  const kpisAfterClear = await fetchKpis(branch.id, today)
  assertCase(
    `${branch.name} — credit KPI drops after same-day clear`,
    Number(kpisAfterClear.creditReceived) < Number(kpisBeforeClear.creditReceived),
    `before ₹${kpisBeforeClear.creditReceived} after ₹${kpisAfterClear.creditReceived}`,
  )
  assertCase(
    `${branch.name} — revenue includes UPI clear`,
    Number(kpisAfterClear.onlineReceived) >= Number(kpisBeforeClear.onlineReceived) + total - 0.01,
    `online ₹${kpisAfterClear.onlineReceived}`,
  )

  const duesAfterClear = await fetchDues(branch.id, {})
  const stillDue3 = duesAfterClear.rows.find((r) => r.orderId === cleared.orderId)
  assertCase(`${branch.name} — cleared order off due list`, !stillDue3, cleared.orderId)

  return {
    branch: branch.name,
    fullCreditOrderId: paid1.orderId,
    splitOrderId: paid2.orderId,
    clearedOrderId: cleared.orderId,
    kpisBeforeToday,
    kpisAfterCreditToday,
    kpisAfterClear,
    kpisBeforeAll,
  }
}

async function loadDiscountStudent(branch) {
  return prisma.students.findFirst({
    where: {
      isActive: true,
      class: { branchId: branch.id, grade: 1 },
      orders: { none: { notes: { contains: MARKER } } },
    },
    orderBy: { rollNumber: 'desc' },
  })
}

async function runDiscountClearCase(ctx) {
  const { branch, items, unitPrice } = ctx
  const student = await loadDiscountStudent(branch)
  if (!student) throw new Error(`No discount-test student for ${branch.name}`)
  const discount = Math.min(50, unitPrice - 100)
  const total = unitPrice

  console.log(`\n━━━ ${branch.name} — discount clear due ━━━`)
  const order = await createOrder(branch, student, items, total, `${branch.name} discount clear`)
  await pay(order.id, total, 'CREDIT')
  const balance = total - discount
  const cleared = await pay(order.id, balance, 'CASH', {
    discountAmount: discount,
    notes: 'Discount clear smoke',
  })
  assertCase(`${branch.name} — discount clear PAID`, cleared.paymentStatus === 'PAID')
  assertCase(`${branch.name} — discount reduces total`, Number(cleared.total) === total - discount)

  const dues = await fetchDues(branch.id, {})
  assertCase(`${branch.name} — discount cleared off due list`, !dues.rows.find((r) => r.orderId === cleared.orderId))
}

async function main() {
  console.log('Credit transaction smoke test (dev DB)')
  console.log(`API: ${API}`)

  await cleanup()
  await login()
  console.log('Logged in as superadmin')

  const contexts = []
  for (const name of BRANCH_NAMES) {
    contexts.push(await loadBranchContext(name))
  }

  const summaries = []
  for (let i = 0; i < contexts.length; i++) {
    summaries.push(await runBranchScenarios(contexts[i], i * 3))
    await runDiscountClearCase(contexts[i])
  }

  // Cross-check: all-payments credit KPI vs manual sum for Darga
  const darga = contexts[0].branch
  const allKpi = await fetchKpis(darga.id, {})
  const expectedAll = await computeExpectedOutstandingCredit(darga.id, {})
  assertCase(
    'Darga ALL outstanding credit matches DB',
    Math.abs(Number(allKpi.creditReceived) - expectedAll) < 0.02,
    `API ₹${allKpi.creditReceived} expected ₹${expectedAll}`,
  )

  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log('\n══════════════════════════════════════')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log('══════════════════════════════════════')

  if (failed > 0) process.exitCode = 1

  console.log('\nSummary by branch:')
  for (const s of summaries) {
    console.log(`- ${s.branch}: full=${s.fullCreditOrderId}, split=${s.splitOrderId}, cleared=${s.clearedOrderId}`)
    console.log(`  today credit after orders: ₹${s.kpisAfterCreditToday.creditReceived}`)
    console.log(`  today revenue after clear: ₹${s.kpisAfterClear.revenueToday} (cash+online)`)
  }

  const cleanupFlag = process.env.CLEANUP_SMOKE_ORDERS === '1'
  if (cleanupFlag) {
    await cleanup()
    console.log('\nSmoke orders cleaned up (CLEANUP_SMOKE_ORDERS=1).')
  } else {
    console.log('\nSmoke orders LEFT in dev DB (filter Transactions by Today to verify).')
    console.log('To remove them later: CLEANUP_SMOKE_ORDERS=1 node prisma/smoke-credit-transactions.js')
  }
}

main()
  .catch((err) => {
    console.error('\nFAILED:', err.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
