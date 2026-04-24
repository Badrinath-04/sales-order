const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, notFound, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

async function getKpis(req, res) {
  try {
    const { branchId } = req.query
    const cacheKey = `transactions:kpis:${branchId || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where = {}
    if (branchId) where.branchId = branchId

    const [revenueToday, ordersToday, weeklyRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...where, paidAt: { gte: today } },
      }),
      prisma.order.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.transaction.groupBy({
        by: ['paidAt'],
        _sum: { amount: true },
        where: { ...where, paidAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
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
    const { branchId, status, kitType, search, dateFrom, dateTo } = req.query

    const where = {}
    if (branchId) where.order = { branchId }
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.paidAt = {}
      if (dateFrom) where.paidAt.gte = new Date(dateFrom)
      if (dateTo) where.paidAt.lte = new Date(dateTo)
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
            include: {
              student: { select: { name: true, initials: true } },
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

async function getOne(req, res) {
  try {
    // Support lookup by transaction id or order id
    const { id } = req.params
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
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

module.exports = { getKpis, list, getOne }
