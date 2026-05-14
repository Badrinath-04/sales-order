const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, badRequest, serverError } = require('../../utils/response')
const { OPERATIONAL_BRANCH_FILTER } = require('../../utils/operationalBranch')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

function dateRange(daysBack) {
  const to = new Date()
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
  return { from, to }
}

/** Calendar-day bounds from YYYY-MM-DD in the server local timezone (matches browser presets). */
function parseDayStart(isoDate) {
  const s = String(isoDate || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function parseDayEnd(isoDate) {
  const s = String(isoDate || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

function resolveDashboardRange(q) {
  if (q.dateFrom && q.dateTo) {
    const from = parseDayStart(q.dateFrom)
    const to = parseDayEnd(q.dateTo)
    if (from && to && from <= to) {
      return { from, to, cacheSuffix: `${q.dateFrom}:${q.dateTo}` }
    }
  }
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { from, to, cacheSuffix: 'today' }
}

function resolveBranchPerfRange(q) {
  if (q.dateFrom && q.dateTo) {
    const from = parseDayStart(q.dateFrom)
    const to = parseDayEnd(q.dateTo)
    if (from && to && from <= to) {
      return { from, to, cacheSuffix: `r:${q.dateFrom}:${q.dateTo}` }
    }
  }
  const days = Math.min(Math.max(parseInt(q.days, 10) || 30, 1), 366)
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)
  return { from, to, cacheSuffix: `d${days}` }
}

async function branchPerformance(req, res) {
  try {
    const { from, to, cacheSuffix } = resolveBranchPerfRange(req.query)
    const scopeKey =
      req.query.branchId ||
      (req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId ? req.user.branchId : 'all')
    const cacheKey = `reports:branch-perf:v2:${cacheSuffix}:s:${scopeKey}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const branchWhere = {
      ...OPERATIONAL_BRANCH_FILTER,
      ...(req.query.branchId ? { id: req.query.branchId } : {}),
    }

    const branches = await prisma.branch.findMany({
      where: branchWhere,
      select: { id: true, name: true, code: true, type: true },
      orderBy: { name: 'asc' },
    })
    const branchIds = branches.map((b) => b.id)
    if (branchIds.length === 0) {
      const empty = []
      cache.set(cacheKey, empty, cache.TTL.MEDIUM)
      return ok(res, empty)
    }

    const [orderGroups, revenueGroups, pendingOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['branchId'],
        where: {
          branchId: { in: branchIds },
          createdAt: { gte: from, lte: to },
        },
        _count: { id: true },
      }),
      prisma.transaction.groupBy({
        by: ['branchId'],
        where: {
          branchId: { in: branchIds },
          paidAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          createdAt: { gte: from, lte: to },
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        select: { branchId: true, total: true, paidAmount: true },
      }),
    ])

    const orderCountMap = Object.fromEntries(orderGroups.map((r) => [r.branchId, r._count.id]))
    const revenueMap = Object.fromEntries(
      revenueGroups.map((r) => [r.branchId, Number(r._sum.amount || 0)]),
    )
    const pendingMap = {}
    for (const o of pendingOrders) {
      const bal = Math.max(0, Number(o.total) - Number(o.paidAmount))
      pendingMap[o.branchId] = (pendingMap[o.branchId] || 0) + bal
    }

    const data = branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      type: b.type,
      totalOrders: orderCountMap[b.id] ?? 0,
      revenue: revenueMap[b.id] ?? 0,
      pendingRevenue: pendingMap[b.id] ?? 0,
    }))

    cache.set(cacheKey, data, cache.TTL.MEDIUM)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function salesTrend(req, res) {
  try {
    const { branchId, days = 7, dateFrom, dateTo } = req.query
    let from
    let to
    let cacheKeyPart

    if (dateFrom && dateTo) {
      const a = parseDayStart(dateFrom)
      const b = parseDayEnd(dateTo)
      if (!a || !b || a > b) return badRequest(res, 'Invalid dateFrom / dateTo')
      from = a
      to = b
      cacheKeyPart = `r:${dateFrom}:${dateTo}:${branchId || 'all'}`
    } else {
      const dr = dateRange(parseInt(days, 10) || 7)
      from = dr.from
      to = dr.to
      cacheKeyPart = `${branchId || 'all'}:${days}`
    }

    const cacheKey = `reports:trend:v2:${cacheKeyPart}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const where = {
      paidAt: { gte: from, lte: to },
      ...(branchId ? { branchId } : { branch: OPERATIONAL_BRANCH_FILTER }),
    }

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
    const { from, to, cacheSuffix } = resolveDashboardRange(req.query)
    // v2: align KPIs with branch-performance (no student-grade filter on orders/transactions)
    const cacheKey = `reports:super-dashboard:v2:${cacheSuffix}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const orderWindow = {
      createdAt: { gte: from, lte: to },
      branch: OPERATIONAL_BRANCH_FILTER,
    }

    const [
      revenueAgg,
      ordersCount,
      pendingRows,
      totalBranches,
      recentOrders,
      branchStats,
      branchRevenueRows,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: { gte: from, lte: to },
          branch: OPERATIONAL_BRANCH_FILTER,
        },
      }),
      prisma.order.count({ where: orderWindow }),
      prisma.order.findMany({
        where: {
          ...orderWindow,
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        select: { total: true, paidAmount: true },
      }),
      prisma.branch.count({ where: OPERATIONAL_BRANCH_FILTER }),
      prisma.order.findMany({
        take: 10,
        where: orderWindow,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          student: { select: { name: true, initials: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
      prisma.branch.findMany({
        where: OPERATIONAL_BRANCH_FILTER,
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.transaction.groupBy({
        by: ['branchId'],
        where: {
          paidAt: { gte: from, lte: to },
          branch: OPERATIONAL_BRANCH_FILTER,
        },
        _sum: { amount: true },
      }),
    ])

    let pendingRevenue = 0
    for (const o of pendingRows) {
      const bal = Number(o.total) - Number(o.paidAmount)
      if (bal > 0) pendingRevenue += bal
    }
    const pendingPayments = pendingRows.length

    const revByBranch = Object.fromEntries(
      branchRevenueRows.map((r) => [r.branchId, Number(r._sum.amount || 0)]),
    )

    const data = {
      kpis: {
        revenueToday: Number(revenueAgg._sum.amount || 0),
        ordersToday: ordersCount,
        pendingRevenue,
        pendingPayments,
        totalBranches,
      },
      recentOrders,
      branchStats: branchStats.map((b) => {
        const tr = revByBranch[b.id] ?? 0
        return {
          id: b.id,
          name: b.name,
          code: b.code,
          type: b.type,
          totalOrders: b._count.orders,
          todayRevenue: tr,
          revenue: tr,
        }
      }),
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
    const { from, to, cacheSuffix } = resolveDashboardRange(req.query)
    const cacheKey = `reports:admin-dashboard:v2:${branchId || 'none'}:${cacheSuffix}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const baseOrder = branchId ? { branchId } : { branch: OPERATIONAL_BRANCH_FILTER }

    const [revenueAgg, ordersCount, pendingOrdersInPeriod, recentOrders, inventorySnapshot] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...(branchId ? { branchId } : { branch: OPERATIONAL_BRANCH_FILTER }),
          paidAt: { gte: from, lte: to },
        },
      }),
      prisma.order.count({
        where: {
          ...baseOrder,
          createdAt: { gte: from, lte: to },
        },
      }),
      prisma.order.findMany({
        where: {
          ...baseOrder,
          createdAt: { gte: from, lte: to },
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        select: { total: true, paidAmount: true },
      }),
      prisma.order.findMany({
        where: {
          ...baseOrder,
          createdAt: { gte: from, lte: to },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          student: { select: { name: true, initials: true } },
          branch: { select: { name: true, code: true } },
        },
      }),
      branchId
        ? Promise.all([
            prisma.bookStock.aggregate({
              _sum: { quantity: true },
              where: {
                branchId,
                item: { kit: { class: { grade: SUPPORTED_CLASS_GRADE } } },
              },
            }),
            prisma.uniformStock.aggregate({ _sum: { quantity: true }, where: { branchId } }),
          ])
        : Promise.resolve([{ _sum: { quantity: 0 } }, { _sum: { quantity: 0 } }]),
    ])

    let pendingRevenue = 0
    for (const o of pendingOrdersInPeriod) {
      const bal = Number(o.total) - Number(o.paidAmount)
      if (bal > 0) pendingRevenue += bal
    }

    const [booksSnap, uniformsSnap] = inventorySnapshot
    const data = {
      kpis: {
        revenueToday: Number(revenueAgg._sum.amount || 0),
        ordersToday: ordersCount,
        pendingRevenue,
        pendingPayments: pendingOrdersInPeriod.length,
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

module.exports = { branchPerformance, salesTrend, superDashboard, adminDashboard }
