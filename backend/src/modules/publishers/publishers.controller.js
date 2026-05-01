const prisma = require('../../services/prisma')
const { OPERATIONAL_BRANCH_FILTER } = require('../../utils/operationalBranch')
const { ok, notFound, serverError, badRequest } = require('../../utils/response')

async function computePublisherBalances(publisherId) {
  const [procSum, paySum, lastPayment] = await Promise.all([
    prisma.procurementEntry.aggregate({
      where: { publisherId },
      _sum: { totalAmount: true },
    }),
    prisma.publisherPayment.aggregate({
      where: { publisherId },
      _sum: { amount: true },
    }),
    prisma.publisherPayment.findFirst({
      where: { publisherId },
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
  ])
  const totalProcured = Number(procSum._sum.totalAmount ?? 0)
  const totalPaid = Number(paySum._sum.amount ?? 0)
  const pendingBalance = totalProcured - totalPaid
  return {
    totalProcured,
    totalPaid,
    pendingBalance,
    lastPaymentDate: lastPayment?.date ?? null,
  }
}

// ─── Publishers ───────────────────────────────────────────────────────────────

async function listPublishers(req, res) {
  try {
    const publishers = await prisma.publisher.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { procurements: true, payments: true } },
      },
    })

    const now = Date.now()
    const withBalances = await Promise.all(
      publishers.map(async (p) => {
        const balance = await computePublisherBalances(p.id)
        const oldestUnpaid = await prisma.procurementEntry.findFirst({
          where: { publisherId: p.id, totalAmount: { gt: 0 } },
          orderBy: { date: 'asc' },
          select: { date: true },
        })
        const overdue = balance.pendingBalance > 0 && oldestUnpaid
          ? (now - new Date(oldestUnpaid.date).getTime()) > (30 * 24 * 60 * 60 * 1000)
          : false
        return { ...p, ...balance, isOverdue: overdue }
      }),
    )

    return ok(res, withBalances)
  } catch {
    return serverError(res)
  }
}

async function getPublisher(req, res) {
  try {
    const publisher = await prisma.publisher.findUnique({
      where: { id: req.params.id },
      include: {
        procurements: {
          orderBy: { date: 'desc' },
          include: { branch: { select: { name: true, code: true } }, bookItem: { select: { label: true } } },
        },
        payments: { orderBy: { date: 'desc' } },
      },
    })
    if (!publisher) return notFound(res, 'Publisher not found')

    const balance = await computePublisherBalances(publisher.id)
    let running = balance.totalProcured
    const paymentLedger = [...publisher.payments]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((pay) => {
        running -= Number(pay.amount)
        return {
          ...pay,
          runningOutstanding: Math.max(running, 0),
        }
      })
      .reverse()

    const now = Date.now()
    const oldestUnpaid = publisher.procurements.length ? publisher.procurements[publisher.procurements.length - 1] : null
    const isOverdue = balance.pendingBalance > 0 && oldestUnpaid
      ? (now - new Date(oldestUnpaid.date).getTime()) > (30 * 24 * 60 * 60 * 1000)
      : false

    return ok(res, { ...publisher, ...balance, isOverdue, paymentLedger })
  } catch {
    return serverError(res)
  }
}

async function createPublisher(req, res) {
  try {
    const { name, contactPerson, phone, email, address, notes } = req.body
    if (!name) return badRequest(res, 'Publisher name is required')

    const publisher = await prisma.publisher.create({
      data: { name, contactPerson, phone, email, address, notes },
    })
    return ok(res, publisher, 201)
  } catch {
    return serverError(res)
  }
}

async function updatePublisher(req, res) {
  try {
    const { name, contactPerson, phone, email, address, notes, isActive } = req.body
    const publisher = await prisma.publisher.findUnique({ where: { id: req.params.id } })
    if (!publisher) return notFound(res, 'Publisher not found')

    const updated = await prisma.publisher.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
}

// ─── Procurement ──────────────────────────────────────────────────────────────

async function listProcurements(req, res) {
  try {
    const { publisherId, branchId } = req.query
    const where = {}
    if (publisherId) where.publisherId = publisherId
    if (branchId) where.branchId = branchId

    const entries = await prisma.procurementEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        publisher: { select: { id: true, name: true } },
        branch: { select: { name: true, code: true } },
        bookItem: { select: { label: true } },
      },
    })
    return ok(res, entries)
  } catch {
    return serverError(res)
  }
}

async function createProcurement(req, res) {
  try {
    const {
      publisherId,
      date,
      bookItemId,
      productLabel,
      quantity,
      ratePerUnit,
      paymentMethod,
      amountPaid,
      notes,
      distribution = {},
    } = req.body
    if (!publisherId || !date || !productLabel || !quantity || !ratePerUnit) {
      return badRequest(res, 'publisherId, date, productLabel, quantity, and ratePerUnit are required')
    }

    const qty = Number(quantity)
    const totalAmount = qty * Number(ratePerUnit)
    const paid = Number(amountPaid ?? 0)

    const branches = await prisma.branch.findMany({
      where: OPERATIONAL_BRANCH_FILTER,
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    })
    const allowedIds = new Set(branches.map((b) => b.id))

    const branchQty = {}
    if (distribution && typeof distribution === 'object') {
      for (const id of allowedIds) {
        const raw = distribution[id]
        if (raw === undefined || raw === null || raw === '') continue
        const n = Math.max(0, Number(raw))
        if (n > 0) branchQty[id] = n
      }
    }

    const allocated = Object.values(branchQty).reduce((s, n) => s + n, 0)
    if (allocated > qty) {
      return badRequest(res, 'Distributed quantity cannot exceed total quantity')
    }

    const sorted = [...branches]
    const qtyDarga = Math.max(0, Number(branchQty[sorted[0]?.id] ?? 0))
    const qtyNarsingi = Math.max(0, Number(branchQty[sorted[1]?.id] ?? 0))
    const qtySheikpet = Math.max(0, Number(branchQty[sorted[2]?.id] ?? 0))

    const entry = await prisma.$transaction(async (tx) => {

      const proc = await tx.procurementEntry.create({
        data: {
          publisherId,
          branchId: sorted[0]?.id ?? null,
          date: new Date(date),
          bookItemId: bookItemId || null,
          productLabel,
          quantity: qty,
          branchDistribution: branchQty,
          qtyDarga,
          qtyNarsingi,
          qtySheikpet,
          ratePerUnit: Number(ratePerUnit),
          totalAmount,
          paymentMethod: paymentMethod || null,
          amountPaid: paid,
          notes: notes || null,
        },
      })

      // Auto-increment book stock branch-wise if mapped and quantity distributed
      if (bookItemId) {
        const distMap = Object.entries(branchQty).map(([bid, q]) => ({
          branch: branches.find((b) => b.id === bid),
          qty: q,
        }))
        for (const d of distMap) {
          if (!d.branch?.id || d.qty <= 0) continue
          const existing = await tx.bookStock.findUnique({
            where: { itemId_branchId: { itemId: bookItemId, branchId: d.branch.id } },
          })
          const before = existing?.quantity ?? 0
          const after = before + d.qty
          const tone = after <= 10 ? 'CRITICAL' : after <= 50 ? 'LOW' : 'NORMAL'
          await tx.bookStock.upsert({
            where: { itemId_branchId: { itemId: bookItemId, branchId: d.branch.id } },
            create: { itemId: bookItemId, branchId: d.branch.id, quantity: after, tone },
            update: { quantity: after, tone },
          })
          await tx.inventoryLog.create({
            data: {
              branchId: d.branch.id,
              itemType: 'BOOK',
              bookItemId,
              changeType: 'PROCUREMENT',
              quantityBefore: before,
              quantityAfter: after,
              quantityDelta: d.qty,
              performedById: req.user.id,
              notes: `Procurement — ${productLabel}`,
            },
          })
        }
      }

      return proc
    })

    return ok(res, entry, 201)
  } catch (err) {
    console.error(err)
    return serverError(res)
  }
}

// ─── Publisher Payments ───────────────────────────────────────────────────────

async function addPayment(req, res) {
  try {
    const { publisherId } = req.params
    const { date, amount, paymentMethod, referenceId, notes } = req.body
    if (!date || !amount || !paymentMethod) {
      return badRequest(res, 'date, amount, and paymentMethod are required')
    }

    const publisher = await prisma.publisher.findUnique({ where: { id: publisherId } })
    if (!publisher) return notFound(res, 'Publisher not found')

    const payment = await prisma.publisherPayment.create({
      data: {
        publisherId,
        date: new Date(date),
        amount: Number(amount),
        paymentMethod,
        referenceId: referenceId || null,
        notes: notes || null,
      },
    })
    return ok(res, payment, 201)
  } catch {
    return serverError(res)
  }
}

// ─── Accounts Dashboard ───────────────────────────────────────────────────────

async function getAccountsDashboard(req, res) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [procTotal, procMonth, payMonth, payTotal, publishers] = await Promise.all([
      prisma.procurementEntry.aggregate({ _sum: { totalAmount: true } }),
      prisma.procurementEntry.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { totalAmount: true, quantity: true },
      }),
      prisma.publisherPayment.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.publisherPayment.aggregate({ _sum: { amount: true } }),
      prisma.publisher.findMany({
        where: { isActive: true },
        select: { id: true, name: true, contactPerson: true, phone: true },
      }),
    ])

    // Pending balances per publisher
    const withBalances = await Promise.all(
      publishers.map(async (p) => {
        const balance = await computePublisherBalances(p.id)
        const oldestUnpaid = await prisma.procurementEntry.findFirst({
          where: { publisherId: p.id, totalAmount: { gt: 0 } },
          orderBy: { date: 'asc' },
          select: { date: true },
        })
        const isOverdue = balance.pendingBalance > 0 && oldestUnpaid
          ? (Date.now() - new Date(oldestUnpaid.date).getTime()) > (30 * 24 * 60 * 60 * 1000)
          : false
        return { ...p, ...balance, isOverdue }
      }),
    )

    const pendingPublishers = withBalances
      .filter((p) => p.pendingBalance > 0)
      .sort((a, b) => b.pendingBalance - a.pendingBalance)

    return ok(res, {
      totalOutstandingBalance: Number(procTotal._sum.totalAmount ?? 0) - Number(payTotal._sum.amount ?? 0),
      totalPaidThisMonth: Number(payMonth._sum.amount ?? 0),
      totalStockProcuredThisMonth: Number(procMonth._sum.quantity ?? 0),
      totalAmountThisMonth: Number(procMonth._sum.totalAmount ?? 0),
      pendingPublishers,
    })
  } catch {
    return serverError(res)
  }
}

module.exports = {
  listPublishers,
  getPublisher,
  createPublisher,
  updatePublisher,
  listProcurements,
  createProcurement,
  addPayment,
  getAccountsDashboard,
}
