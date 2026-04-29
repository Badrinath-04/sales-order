const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, notFound, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

async function getKpis(req, res) {
  try {
    const { branchId } = req.query
    const cacheKey = `transactions:kpis:${branchId || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orderWhere = { student: { class: { grade: SUPPORTED_CLASS_GRADE } } }
    if (branchId) orderWhere.branchId = branchId
    const transactionWhere = { order: orderWhere }

    const [revenueToday, ordersToday, weeklyRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...transactionWhere, paidAt: { gte: today } },
      }),
      prisma.order.count({ where: { ...orderWhere, createdAt: { gte: today } } }),
      prisma.transaction.groupBy({
        by: ['paidAt'],
        _sum: { amount: true },
        where: { ...transactionWhere, paidAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { paidAt: 'asc' },
      }),
    ])

    const data = {
      revenueToday: Number(revenueToday._sum.amount || 0),
      ordersToday,
      weeklyRevenue,
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { branchId, status, paymentMethod, search, dateFrom, dateTo } = req.query

    const where = { order: { student: { class: { grade: SUPPORTED_CLASS_GRADE } } } }
    if (branchId) where.order.branchId = branchId
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (dateFrom || dateTo) {
      where.paidAt = {}
      if (dateFrom) where.paidAt.gte = new Date(dateFrom)
      if (dateTo) where.paidAt.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { order: { orderId: { contains: search, mode: 'insensitive' } } },
        { order: { student: { name: { contains: search, mode: 'insensitive' } } } },
        { order: { student: { rollNumber: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderId: true,
              notes: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  initials: true,
                  rollNumber: true,
                  guardianName: true,
                  guardianPhone: true,
                  class: { select: { label: true, section: true } },
                },
              },
              branch: { select: { name: true, code: true } },
            },
          },
        },
      }),
    ])
    return ok(res, rows, buildMeta(total, page, limit))
  } catch {
    return serverError(res)
  }
}

async function listDues(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { branchId, search, classGrade, paymentStatus, paymentMethod, dateFrom, dateTo } = req.query

    const where = {
      student: { class: { grade: SUPPORTED_CLASS_GRADE } },
      status: { not: 'CANCELLED' },
      paymentStatus: paymentStatus || { in: ['UNPAID', 'PARTIAL'] },
    }
    if (branchId) where.branchId = branchId
    if (classGrade) where.student.class.grade = Number(classGrade)
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const rows = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            initials: true,
            rollNumber: true,
            guardianName: true,
            guardianPhone: true,
            class: { select: { id: true, grade: true, label: true, section: true } },
          },
        },
        branch: { select: { id: true, name: true, code: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    })

    const filtered = rows
      .map((order) => {
        const totalAmount = Number(order.total ?? 0)
        const paidAmount = Number(order.paidAmount ?? 0)
        const dueAmount = Math.max(0, totalAmount - paidAmount)
        return {
          ...order,
          totalAmount,
          paidAmount,
          dueAmount,
        }
      })
      .filter((row) => row.dueAmount > 0)

    const total = filtered.length
    const paged = filtered.slice(skip, skip + limit)

    return ok(res, paged, buildMeta(total, page, limit))
  } catch {
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    // Support lookup by transaction id or order id
    const { id } = req.params
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderId: id }],
        student: { class: { grade: SUPPORTED_CLASS_GRADE } },
      },
      include: {
        student: { include: { class: true } },
        branch: true,
        createdBy: { select: { displayName: true } },
        items: {
          include: {
            bookItem: true,
            uniformSize: { include: { category: true } },
            accessory: true,
          },
        },
        transactions: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!order) return notFound(res, 'Transaction not found')
    return ok(res, order)
  } catch {
    return serverError(res)
  }
}

module.exports = { getKpis, list, listDues, getOne }
