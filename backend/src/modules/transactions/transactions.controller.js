const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, notFound, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')
const { sumPaymentBuckets } = require('../../utils/paymentMethodBuckets')
const {
  resolveTransactionBranchScope,
  applyBranchToTransactionWhere,
  applyBranchToOrderWhere,
} = require('../../utils/transactionBranchScope')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

/** Shared filters for transaction list + KPI aggregates (aligned with reports queries). */
function buildTransactionWhere(query, { includeSearch = true } = {}) {
  const { status, paymentMethod, search, dateFrom, dateTo, classGrade } = query
  const branchScope = resolveTransactionBranchScope(query)
  if (branchScope.error) return branchScope

  const classGradeNum = classGrade != null && classGrade !== '' ? Number(classGrade) : null
  const classGradeFilter = classGradeNum != null && !Number.isNaN(classGradeNum) ? classGradeNum : null

  // Build conditions as an explicit AND array so Prisma applies each filter independently.
  const conditions = []

  // Always restrict to supported grade range; narrow to specific grade when requested.
  conditions.push({
    order: {
      student: {
        class: { grade: classGradeFilter !== null ? classGradeFilter : SUPPORTED_CLASS_GRADE },
      },
    },
  })

  applyBranchToTransactionWhere(conditions, branchScope)

  // Payment status filter
  if (status) conditions.push({ status })

  // Payment method filter
  if (paymentMethod) conditions.push({ paymentMethod })

  // Date range filter
  if (dateFrom || dateTo) {
    const paidAt = {}
    if (dateFrom) paidAt.gte = new Date(dateFrom)
    if (dateTo) paidAt.lte = new Date(dateTo)
    conditions.push({ paidAt })
  }

  // Search filter — must be separate so OR doesn't bypass the AND conditions above
  if (includeSearch && search) {
    conditions.push({
      OR: [
        { order: { orderId: { contains: search, mode: 'insensitive' } } },
        { order: { student: { name: { contains: search, mode: 'insensitive' } } } },
        { order: { student: { rollNumber: { contains: search, mode: 'insensitive' } } } },
      ],
    })
  }

  return { AND: conditions }
}

/** KPI aggregates — same filters as list, but without search (reports-style branch + paidAt). */
function buildKpiWhere(query) {
  const { status, paymentMethod, dateFrom, dateTo, classGrade } = query
  const branchScope = resolveTransactionBranchScope(query)
  if (branchScope.error) return branchScope

  const classGradeNum = classGrade != null && classGrade !== '' ? Number(classGrade) : null
  const classGradeFilter = classGradeNum != null && !Number.isNaN(classGradeNum) ? classGradeNum : null

  const conditions = []

  if (classGradeFilter !== null) {
    conditions.push({ order: { student: { class: { grade: classGradeFilter } } } })
  } else {
    conditions.push({ order: { student: { class: { grade: SUPPORTED_CLASS_GRADE } } } })
  }

  applyBranchToTransactionWhere(conditions, branchScope)

  if (status) conditions.push({ status })
  if (paymentMethod) conditions.push({ paymentMethod })

  if (dateFrom || dateTo) {
    const paidAt = {}
    if (dateFrom) paidAt.gte = new Date(dateFrom)
    if (dateTo) paidAt.lte = new Date(dateTo)
    conditions.push({ paidAt })
  }

  return { AND: conditions }
}

async function getKpis(req, res) {
  try {
    const { branchId, allBranches, dateFrom, dateTo, status, paymentMethod, classGrade } = req.query
    const cacheKey = `transactions:kpis:v6:${branchId || ''}:${allBranches || ''}:${dateFrom || ''}:${dateTo || ''}:${status || ''}:${paymentMethod || ''}:${classGrade || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const transactionWhere = buildKpiWhere(req.query)
    if (transactionWhere.error) {
      return res.status(400).json({ success: false, message: transactionWhere.error })
    }
    const partialWhere = { AND: [...transactionWhere.AND, { status: { in: ['PARTIAL', 'UNPAID'] } }] }

    const [revenueAgg, ordersCount, byMethod, partialAgg] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: transactionWhere,
      }),
      prisma.transaction.count({ where: transactionWhere }),
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: transactionWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: partialWhere,
      }),
    ])

    const { cashReceived, onlineReceived } = sumPaymentBuckets(byMethod)

    const data = {
      revenueToday: Number(revenueAgg._sum.amount || 0),
      ordersToday: ordersCount,
      cashReceived,
      onlineReceived,
      pendingPartial: Number(partialAgg._sum.amount || 0),
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch (err) {
    console.error('transactions.getKpis', err)
    return serverError(res)
  }
}

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)

    const where = buildTransactionWhere(req.query, { includeSearch: true })
    if (where.error) {
      return res.status(400).json({ success: false, message: where.error })
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
    const { search, classGrade, paymentStatus, paymentMethod, dateFrom, dateTo } = req.query
    const branchScope = resolveTransactionBranchScope(req.query)
    if (branchScope.error) {
      return res.status(400).json({ success: false, message: branchScope.error })
    }

    const classGradeNum = classGrade != null && classGrade !== '' ? Number(classGrade) : null
    const classGradeFilter = classGradeNum != null && !Number.isNaN(classGradeNum) ? classGradeNum : null

    const dueConditions = [
      { status: { not: 'CANCELLED' } },
      { paymentStatus: paymentStatus || { in: ['UNPAID', 'PARTIAL'] } },
      { student: { class: { grade: classGradeFilter !== null ? classGradeFilter : SUPPORTED_CLASS_GRADE } } },
    ]

    applyBranchToOrderWhere(dueConditions, branchScope)
    if (paymentMethod) dueConditions.push({ paymentMethod })
    if (dateFrom || dateTo) {
      const createdAt = {}
      if (dateFrom) createdAt.gte = new Date(dateFrom)
      if (dateTo) createdAt.lte = new Date(dateTo)
      dueConditions.push({ createdAt })
    }
    if (search) {
      dueConditions.push({
        OR: [
          { orderId: { contains: search, mode: 'insensitive' } },
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
        ],
      })
    }

    const where = { AND: dueConditions }

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
  const isTransientConnectionError = (err) => {
    const msg = String(err?.message ?? '')
    return (
      err?.code === 'P2024' || // Prisma pool timeout
      msg.includes('Server has closed the connection') ||
      msg.includes('Timed out fetching a new connection from the connection pool') ||
      msg.includes('Error in PostgreSQL connection')
    )
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    // Support lookup by transaction id or order id
    const { id } = req.params
    let order = null
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        order = await prisma.order.findFirst({
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
        break
      } catch (err) {
        if (!isTransientConnectionError(err) || attempt === 2) throw err
        try {
          await prisma.$connect()
        } catch {
          // Ignore connect errors; retry may still succeed.
        }
        await sleep(120)
      }
    }

    if (!order) return notFound(res, 'Transaction not found')
    return ok(res, order)
  } catch (err) {
    if (isTransientConnectionError(err)) {
      return serverError(res, 'Database is temporarily busy. Please retry in a few seconds.')
    }
    return serverError(res)
  }
}

module.exports = { getKpis, list, listDues, getOne }
