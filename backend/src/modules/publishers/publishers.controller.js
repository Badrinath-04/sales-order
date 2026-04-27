const prisma = require('../../services/prisma')
const { ok, notFound, serverError, badRequest } = require('../../utils/response')

// ─── Publishers ───────────────────────────────────────────────────────────────

async function listPublishers(req, res) {
  try {
    const publishers = await prisma.publisher.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { procurements: true, payments: true } },
      },
    })

    // Compute balances
    const withBalances = await Promise.all(
      publishers.map(async (p) => {
        const [procSum, paySum] = await Promise.all([
          prisma.procurementEntry.aggregate({ where: { publisherId: p.id }, _sum: { totalAmount: true, amountPaid: true } }),
          prisma.publisherPayment.aggregate({ where: { publisherId: p.id }, _sum: { amount: true } }),
        ])
        const totalProcured = Number(procSum._sum.totalAmount ?? 0)
        const paidViaProc = Number(procSum._sum.amountPaid ?? 0)
        const additionalPayments = Number(paySum._sum.amount ?? 0)
        const totalPaid = paidViaProc + additionalPayments
        return { ...p, totalProcured, totalPaid, pendingBalance: totalProcured - totalPaid }
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

    const totalProcured = publisher.procurements.reduce((s, p) => s + Number(p.totalAmount), 0)
    const paidViaProc = publisher.procurements.reduce((s, p) => s + Number(p.amountPaid), 0)
    const additionalPayments = publisher.payments.reduce((s, p) => s + Number(p.amount), 0)
    const totalPaid = paidViaProc + additionalPayments

    return ok(res, { ...publisher, totalProcured, totalPaid, pendingBalance: totalProcured - totalPaid })
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
    const { publisherId, branchId, date, bookItemId, productLabel, quantity, ratePerUnit, paymentMethod, amountPaid, notes } = req.body
    if (!publisherId || !branchId || !date || !productLabel || !quantity || !ratePerUnit) {
      return badRequest(res, 'publisherId, branchId, date, productLabel, quantity, and ratePerUnit are required')
    }

    const totalAmount = Number(quantity) * Number(ratePerUnit)
    const paid = Number(amountPaid ?? 0)

    const entry = await prisma.$transaction(async (tx) => {
      const proc = await tx.procurementEntry.create({
        data: {
          publisherId,
          branchId,
          date: new Date(date),
          bookItemId: bookItemId || null,
          productLabel,
          quantity: Number(quantity),
          ratePerUnit: Number(ratePerUnit),
          totalAmount,
          paymentMethod: paymentMethod || null,
          amountPaid: paid,
          notes: notes || null,
        },
      })

      // Auto-increment book stock if bookItemId provided
      if (bookItemId) {
        const existing = await tx.bookStock.findUnique({
          where: { itemId_branchId: { itemId: bookItemId, branchId } },
        })
        const before = existing?.quantity ?? 0
        const after = before + Number(quantity)
        const tone = after <= 10 ? 'CRITICAL' : after <= 50 ? 'LOW' : 'NORMAL'

        await tx.bookStock.upsert({
          where: { itemId_branchId: { itemId: bookItemId, branchId } },
          create: { itemId: bookItemId, branchId, quantity: after, tone },
          update: { quantity: after, tone },
        })

        await tx.inventoryLog.create({
          data: {
            branchId,
            itemType: 'BOOK',
            bookItemId,
            changeType: 'PROCUREMENT',
            quantityBefore: before,
            quantityAfter: after,
            quantityDelta: Number(quantity),
            performedById: req.user.id,
            notes: `Procurement — ${productLabel}`,
          },
        })
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

    const [procTotal, procMonth, payMonth, publishers] = await Promise.all([
      prisma.procurementEntry.aggregate({ _sum: { totalAmount: true, amountPaid: true } }),
      prisma.procurementEntry.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { totalAmount: true, quantity: true },
      }),
      prisma.publisherPayment.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.publisher.findMany({
        where: { isActive: true },
        select: { id: true, name: true, contactPerson: true, phone: true },
      }),
    ])

    // Pending balances per publisher
    const withBalances = await Promise.all(
      publishers.map(async (p) => {
        const [ps, pp] = await Promise.all([
          prisma.procurementEntry.aggregate({ where: { publisherId: p.id }, _sum: { totalAmount: true, amountPaid: true } }),
          prisma.publisherPayment.aggregate({ where: { publisherId: p.id }, _sum: { amount: true } }),
        ])
        const total = Number(ps._sum.totalAmount ?? 0)
        const paid = Number(ps._sum.amountPaid ?? 0) + Number(pp._sum.amount ?? 0)
        return { ...p, pendingBalance: total - paid }
      }),
    )

    const pendingPublishers = withBalances
      .filter((p) => p.pendingBalance > 0)
      .sort((a, b) => b.pendingBalance - a.pendingBalance)

    return ok(res, {
      totalOutstandingBalance: Number(procTotal._sum.totalAmount ?? 0) - Number(procTotal._sum.amountPaid ?? 0),
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
