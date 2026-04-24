const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, serverError } = require('../../utils/response')

function dateRange(daysBack) {
  const to = new Date()
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  return { from, to }
}

async function financeSummary(req, res) {
  try {
    const { branchId, days = 30 } = req.query
    const cacheKey = `reports:finance:${branchId || 'all'}:${days}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const { from } = dateRange(parseInt(days))
    const where = { paidAt: { gte: from } }
    if (branchId) where.branchId = branchId

    const [revenue, orders, pendingRevenue] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, where }),
      prisma.order.count({ where: { ...(branchId ? { branchId } : {}), createdAt: { gte: from } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          ...(branchId ? { branchId } : {}),
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
          createdAt: { gte: from },
        },
      }),
    ])

    const data = {
      totalRevenue: Number(revenue._sum.amount || 0),
      totalOrders: orders,
      pendingRevenue: Number(pendingRevenue._sum.total || 0),
      avgOrderValue: orders > 0 ? Number(revenue._sum.amount || 0) / orders : 0,
    }
    cache.set(cacheKey, data, cache.TTL.MEDIUM)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function branchPerformance(req, res) {
  try {
    const { days = 30 } = req.query
    const cacheKey = `reports:branch-perf:${days}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const { from } = dateRange(parseInt(days))

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        orders: {
          where: { createdAt: { gte: from } },
          select: { total: true, paymentStatus: true },
        },
        transactions: {
          where: { paidAt: { gte: from } },
          select: { amount: true },
        },
      },
    })

    const data = branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      type: b.type,
      totalOrders: b.orders.length,
      revenue: b.transactions.reduce((s, t) => s + Number(t.amount), 0),
      pendingPayments: b.orders.filter((o) => o.paymentStatus !== 'PAID').length,
    }))

    cache.set(cacheKey, data, cache.TTL.MEDIUM)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function salesTrend(req, res) {
  try {
    const { branchId, days = 7 } = req.query
    const cacheKey = `reports:trend:${branchId || 'all'}:${days}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const { from } = dateRange(parseInt(days))
    const where = { paidAt: { gte: from } }
    if (branchId) where.branchId = branchId

    const transactions = await prisma.transaction.findMany({
      where,
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    })

    const grouped = {}
    for (const t of transactions) {
      const day = t.paidAt.toISOString().slice(0, 10)
      grouped[day] = (grouped[day] || 0) + Number(t.amount)
    }

    const trend = Object.entries(grouped).map(([date, total]) => ({ date, total }))
    cache.set(cacheKey, trend, cache.TTL.KPI)
    return ok(res, trend)
  } catch {
    return serverError(res)
  }
}

async function superDashboard(req, res) {
  try {
    const cacheKey = 'reports:super-dashboard'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [revenueToday, ordersToday, pendingPayments, totalBranches, recentOrders, branchStats] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } } }),
      prisma.branch.count({ where: { isActive: true, type: 'BRANCH' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, initials: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { orders: true } },
          orders: { select: { total: true }, where: { createdAt: { gte: today } } },
        },
      }),
    ])

    const data = {
      kpis: {
        revenueToday: Number(revenueToday._sum.amount || 0),
        ordersToday,
        pendingPayments,
        totalBranches,
      },
      recentOrders,
      branchStats: branchStats.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        type: b.type,
        totalOrders: b._count.orders,
        todayRevenue: b.orders.reduce((s, o) => s + Number(o.total), 0),
      })),
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function adminDashboard(req, res) {
  try {
    const { branchId } = req.query
    const cacheKey = `reports:admin-dashboard:${branchId}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const where = branchId ? { branchId } : {}

    const [revenueToday, ordersToday, pendingPayments, recentOrders, inventorySnapshot] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...where, paidAt: { gte: today } } }),
      prisma.order.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.order.count({ where: { ...where, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } } }),
      prisma.order.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, initials: true } },
        },
      }),
      branchId
        ? Promise.all([
            prisma.bookStock.aggregate({ _sum: { quantity: true }, where: { branchId } }),
            prisma.uniformStock.aggregate({ _sum: { quantity: true }, where: { branchId } }),
          ])
        : Promise.resolve([{ _sum: { quantity: 0 } }, { _sum: { quantity: 0 } }]),
    ])

    const [booksSnap, uniformsSnap] = inventorySnapshot
    const data = {
      kpis: {
        revenueToday: Number(revenueToday._sum.amount || 0),
        ordersToday,
        pendingPayments,
      },
      recentOrders,
      inventorySnapshot: {
        booksStock: Number(booksSnap._sum.quantity || 0),
        uniformsStock: Number(uniformsSnap._sum.quantity || 0),
      },
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

module.exports = { financeSummary, branchPerformance, salesTrend, superDashboard, adminDashboard }
