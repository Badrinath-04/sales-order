const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

function genOrderId() {
  const now = new Date()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `#SKM-${now.getFullYear()}-${rand}`
}

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { branchId, paymentStatus, status, search, dateFrom, dateTo } = req.query

    const where = {}
    if (branchId) where.branchId = branchId
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, rollNumber: true, initials: true } },
          branch: { select: { name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
    ])
    return ok(res, orders, buildMeta(total, page, limit))
  } catch {
    return serverError(res)
  }
}

async function create(req, res) {
  try {
    const { studentId, branchId, items, notes } = req.body
    if (!studentId || !branchId || !items?.length) {
      return badRequest(res, 'studentId, branchId, and items are required')
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const itemsData = items.map((item) => {
        const lineTotal = item.unitPrice * item.quantity
        subtotal += lineTotal
        return {
          itemType: item.itemType,
          bookItemId: item.itemType === 'BOOK' ? item.itemId : null,
          uniformSizeId: item.itemType === 'UNIFORM' ? item.itemId : null,
          accessoryId: item.itemType === 'ACCESSORY' ? item.itemId : null,
          label: item.label,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal,
        }
      })

      const adminFee = 5
      const total = subtotal + adminFee

      return tx.order.create({
        data: {
          orderId: genOrderId(),
          studentId,
          branchId,
          createdById: req.user.id,
          subtotal,
          administrativeFee: adminFee,
          total,
          notes,
          items: { create: itemsData },
        },
        include: { items: true, student: true },
      })
    })

    cache.delByPrefix(`branch:${branchId}`)
    return created(res, order)
  } catch {
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { class: true } },
        branch: true,
        createdBy: { select: { displayName: true } },
        items: {
          include: {
            bookItem: { include: { kit: { include: { class: true } } } },
            uniformSize: { include: { category: true } },
            accessory: { include: { group: true } },
          },
        },
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!order) return notFound(res, 'Order not found')
    return ok(res, order)
  } catch {
    return serverError(res)
  }
}

async function update(req, res) {
  try {
    const { status, bookStatus, uniformStatus, notes } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, bookStatus, uniformStatus, notes },
    })
    return ok(res, order)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Order not found')
    return serverError(res)
  }
}

async function processPayment(req, res) {
  try {
    const { amount, paymentMethod, referenceId, notes } = req.body
    if (!amount || !paymentMethod) return badRequest(res, 'amount and paymentMethod are required')

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) return notFound(res, 'Order not found')

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          branchId: order.branchId,
          amount,
          paymentMethod,
          status: 'PAID',
          referenceId,
          notes,
          paidAt: new Date(),
        },
      })

      const newPaid = Number(order.paidAmount) + Number(amount)
      const paymentStatus =
        newPaid >= Number(order.total) ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID'

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: newPaid,
          paymentStatus,
          paymentMethod,
          referenceId,
          paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
          status: paymentStatus === 'PAID' ? 'COMPLETED' : 'PROCESSING',
        },
        include: { student: true, branch: true, items: true },
      })

      return { order: updated, transaction }
    })

    cache.delByPrefix(`branch:${order.branchId}`)
    return ok(res, result)
  } catch {
    return serverError(res)
  }
}

async function cancel(req, res) {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })
    return ok(res, order)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Order not found')
    return serverError(res)
  }
}

module.exports = { list, create, getOne, update, processPayment, cancel }
