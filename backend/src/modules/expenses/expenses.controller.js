'use strict'
const prisma = require('../../services/prisma')
const { ok, created, badRequest, notFound, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ONLINE_PAYMENT_METHODS = [
  'CANARA_UPI', 'BOB_UPI',
  'UPI_BHARATH', 'UPI_POORNIMA', 'UPI_RAJANI', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_BHARATHI',
  'BANK_TRANSFER', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER',
]

const PAID_STATUSES = { in: ['PAID', 'PARTIAL'] }

const BRANCH_DEFAULT_ONLINE_ALLOCATION_METHODS = {
  shaikpet: ['UPI_RAJANI','OTHER'],
  narsingi: ['UPI_VARALAXMI','OTHER', 'UPI_INDU', 'UPI_POORNIMA'],
  darga: ['UPI_BHARATHI','OTHER' , 'BOB_UPI'],
}

function resolveBranchPaymentMethods(branch) {
  const stored = branch?.paymentMethods
  if (Array.isArray(stored) && stored.length > 0) return stored
  const normalized = String(branch?.name ?? '').trim().toLowerCase()
  for (const [token, methods] of Object.entries(BRANCH_DEFAULT_ONLINE_ALLOCATION_METHODS)) {
    if (normalized.includes(token)) return methods
  }
  return []
}

async function fetchCashCollected(branchId, dateFrom, dateTo) {
  const result = await prisma.transaction.aggregate({
    where: { branchId, paymentMethod: 'CASH', status: PAID_STATUSES, paidAt: { gte: dateFrom, lte: dateTo } },
    _sum: { amount: true },
  })
  return Number(result._sum.amount ?? 0)
}

async function fetchOnlineCollected(branchId, dateFrom, dateTo) {
  const result = await prisma.transaction.aggregate({
    where: { branchId, paymentMethod: { in: ONLINE_PAYMENT_METHODS }, status: PAID_STATUSES, paidAt: { gte: dateFrom, lte: dateTo } },
    _sum: { amount: true },
  })
  return Number(result._sum.amount ?? 0)
}

async function fetchOnlineByMethod(branchId, dateFrom, dateTo) {
  return prisma.transaction.groupBy({
    by: ['paymentMethod'],
    where: { branchId, paymentMethod: { in: ONLINE_PAYMENT_METHODS }, status: PAID_STATUSES, paidAt: { gte: dateFrom, lte: dateTo } },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  })
}

/**
 * Compute running balance up to (but not including) the given date.
 * openingBalance(date) = sum of all prior cash collected − sum of all prior HANDOVER and EXPENSE entries.
 * Floor at 0 to prevent negative opening balances from bad data.
 */
async function computeOpeningBalance(branchId, beforeDate) {
  const [cashIn, cashOut] = await Promise.all([
    prisma.transaction.aggregate({
      where: { branchId, paymentMethod: 'CASH', status: PAID_STATUSES, paidAt: { lt: beforeDate } },
      _sum: { amount: true },
    }),
    prisma.expenseEntry.aggregate({
      where: {
        branchId,
        entryType: { in: ['HANDOVER', 'EXPENSE'] },
        status: 'APPROVED',
        entryDate: { lt: beforeDate },
      },
      _sum: { amount: true },
    }),
  ])
  const opening = Number(cashIn._sum.amount ?? 0) - Number(cashOut._sum.amount ?? 0)
  return Math.max(0, opening)
}

// ─── GET /expenses/dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const branchId = req.query.branchId

    if (!branchId) {
      // Super admin: return summaries for all active branches
      const branches = await prisma.branch.findMany({
        where: { isActive: true, deletedAt: null, type: 'BRANCH' },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      })

      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
      const todayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

      const summaries = await Promise.all(
        branches.map(async (b) => buildBranchDailySummary(b.id, todayStart, todayEnd, b))
      )
      return ok(res, summaries)
    }

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const todayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, code: true },
    })
    if (!branch) return notFound(res, 'Branch not found')

    const summary = await buildBranchDailySummary(branchId, todayStart, todayEnd, branch)
    return ok(res, summary)
  } catch (err) {
    console.error('[expenses] getDashboard failed', err)
    return serverError(res)
  }
}

async function buildBranchDailySummary(branchId, todayStart, todayEnd, branch) {
  const [cashCollected, onlineCollected, todayEntries, openingBalance] = await Promise.all([
    fetchCashCollected(branchId, todayStart, todayEnd),
    fetchOnlineCollected(branchId, todayStart, todayEnd),
    prisma.expenseEntry.findMany({
      where: { branchId, entryDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { createdAt: 'asc' },
    }),
    computeOpeningBalance(branchId, todayStart),
  ])

  const handovers = todayEntries
    .filter((e) => e.entryType === 'HANDOVER')
    .reduce((s, e) => s + Number(e.amount), 0)
  const expenses = todayEntries
    .filter((e) => e.entryType === 'EXPENSE')
    .reduce((s, e) => s + Number(e.amount), 0)
  const onlineAllocations = todayEntries
    .filter((e) => e.entryType === 'ONLINE_ALLOCATION')
    .reduce((s, e) => s + Number(e.amount), 0)

  const totalAvailable = openingBalance + cashCollected
  const closingBalance = totalAvailable - handovers - expenses

  return {
    branch,
    openingBalance,
    cashCollected,
    onlineCollected,
    totalAvailable,
    handovers,
    expenses,
    onlineAllocations,
    closingBalance,
    isNegative: closingBalance < 0,
    entryCount: todayEntries.length,
  }
}

// ─── GET /expenses/entries ────────────────────────────────────────────────────

async function listEntries(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { branchId, entryType, dateFrom, dateTo, search } = req.query

    const conditions = []
    if (branchId) conditions.push({ branchId })
    if (entryType && ['HANDOVER', 'EXPENSE', 'ONLINE_ALLOCATION'].includes(entryType)) {
      conditions.push({ entryType })
    }
    if (dateFrom || dateTo) {
      const dateFilter = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) {
        const d = new Date(dateTo)
        d.setHours(23, 59, 59, 999)
        dateFilter.lte = d
      }
      conditions.push({ entryDate: dateFilter })
    }
    if (search) {
      conditions.push({
        OR: [
          { recipient: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    const where = conditions.length ? { AND: conditions } : {}

    const [rows, total] = await Promise.all([
      prisma.expenseEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy:  { select: { id: true, displayName: true } },
          approvedBy: { select: { id: true, displayName: true } },
          branch:     { select: { id: true, name: true, code: true } },
          publisher:  { select: { id: true, name: true } },
        },
      }),
      prisma.expenseEntry.count({ where }),
    ])

    return ok(res, rows, buildMeta(total, page, limit))
  } catch (err) {
    console.error('[expenses] listEntries failed', err)
    return serverError(res)
  }
}

// ─── POST /expenses/entries ───────────────────────────────────────────────────

async function createEntry(req, res) {
  try {
    const {
      branchId, entryType, amount, paymentMethod,
      recipient, publisherId, category, description, referenceId, notes, entryDate,
    } = req.body

    // Block legacy EXPENSE type — use HANDOVER or ONLINE_ALLOCATION with a category instead
    if (entryType === 'EXPENSE') {
      return badRequest(res, 'EXPENSE entry type is no longer supported. Use HANDOVER or ONLINE_ALLOCATION with a category instead.')
    }

    if (!['HANDOVER', 'ONLINE_ALLOCATION'].includes(entryType)) {
      return badRequest(res, 'entryType must be HANDOVER or ONLINE_ALLOCATION')
    }

    // Validate publisherId exists if provided
    if (publisherId) {
      const publisher = await prisma.publisher.findUnique({ where: { id: publisherId }, select: { id: true } })
      if (!publisher) return badRequest(res, 'Publisher not found')
    }

    // Super admin entries are auto-approved; regular admin entries need approval
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN'
    const status = isSuperAdmin ? 'APPROVED' : 'PENDING'

    const entry = await prisma.expenseEntry.create({
      data: {
        branchId,
        entryType,
        amount,
        paymentMethod,
        recipient: recipient ?? null,
        publisherId: publisherId ?? null,
        category: category ?? null,
        description: description ?? null,
        referenceId: referenceId ?? null,
        notes: notes ?? null,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        status,
        approvedById: isSuperAdmin ? req.user.id : null,
        approvedAt:   isSuperAdmin ? new Date() : null,
        createdById: req.user.id,
      },
      include: {
        createdBy:  { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        branch:     { select: { id: true, name: true, code: true } },
        publisher:  { select: { id: true, name: true } },
      },
    })

    return created(res, entry)
  } catch (err) {
    console.error('[expenses] createEntry failed', err)
    return serverError(res)
  }
}

// ─── PATCH /expenses/entries/:id/status ──────────────────────────────────────

async function updateEntryStatus(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return badRequest(res, 'status must be APPROVED or REJECTED')
    }

    const entry = await prisma.expenseEntry.findUnique({ where: { id } })
    if (!entry) return notFound(res, 'Entry not found')
    if (entry.status !== 'PENDING') {
      return badRequest(res, `Entry is already ${entry.status}`)
    }

    const updated = await prisma.expenseEntry.update({
      where: { id },
      data: {
        status,
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        createdBy:  { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        branch:     { select: { id: true, name: true, code: true } },
      },
    })

    return ok(res, updated)
  } catch (err) {
    console.error('[expenses] updateEntryStatus failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/daily — date-based position + transactions (History tab) ───

async function getDailyPosition(req, res) {
  try {
    const { branchId, date } = req.query
    if (!branchId) return badRequest(res, 'branchId is required')
    if (!date) return badRequest(res, 'date is required (YYYY-MM-DD)')

    const d = new Date(date)
    if (isNaN(d.getTime())) return badRequest(res, 'Invalid date format, use YYYY-MM-DD')

    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, code: true },
    })
    if (!branch) return notFound(res, 'Branch not found')

    const [cashCollected, onlineCollected, onlineByMethodRaw, transactions, entries, openingBalance] = await Promise.all([
      fetchCashCollected(branchId, dayStart, dayEnd),
      fetchOnlineCollected(branchId, dayStart, dayEnd),
      fetchOnlineByMethod(branchId, dayStart, dayEnd),
      prisma.transaction.findMany({
        where: { branchId, status: PAID_STATUSES, paidAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { paidAt: 'asc' },
        include: {
          order: {
            select: {
              orderId: true,
              notes: true,
              student: { select: { id: true, name: true, class: { select: { label: true, section: true } } } },
            },
          },
        },
      }),
      prisma.expenseEntry.findMany({
        where: { branchId, entryDate: { gte: dayStart, lte: dayEnd } },
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          approvedBy: { select: { id: true, displayName: true } },
        },
      }),
      computeOpeningBalance(branchId, dayStart),
    ])

    // Only APPROVED entries affect the cash balance
    const handovers = entries.filter((e) => e.entryType === 'HANDOVER' && e.status === 'APPROVED').reduce((s, e) => s + Number(e.amount), 0)
    const expenses  = entries.filter((e) => e.entryType === 'EXPENSE'  && e.status === 'APPROVED').reduce((s, e) => s + Number(e.amount), 0)

    const onlineByMethod = onlineByMethodRaw.map((r) => ({
      paymentMethod: r.paymentMethod,
      amount: Number(r._sum.amount ?? 0),
      count: r._count,
    }))

    const totalAvailable = openingBalance + cashCollected
    const closingBalance = totalAvailable - handovers - expenses

    return ok(res, {
      branch, date,
      openingBalance, cashCollected, onlineCollected, onlineByMethod,
      totalAvailable, handovers, expenses, closingBalance,
      isNegative: closingBalance < 0,
      transactions,
      entries,
    })
  } catch (err) {
    console.error('[expenses] getDailyPosition failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/reconciliation ────────────────────────────────────────────

async function getReconciliation(req, res) {
  try {
    const { branchId, date } = req.query
    if (!date) return badRequest(res, 'date is required (YYYY-MM-DD)')

    const d = new Date(date)
    if (isNaN(d.getTime())) return badRequest(res, 'Invalid date format, use YYYY-MM-DD')

    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, code: true },
    })
    if (!branch) return notFound(res, 'Branch not found')

    const [cashCollected, onlineCollected, onlineByMethodRaw, entries, openingBalance] = await Promise.all([
      fetchCashCollected(branchId, dayStart, dayEnd),
      fetchOnlineCollected(branchId, dayStart, dayEnd),
      fetchOnlineByMethod(branchId, dayStart, dayEnd),
      prisma.expenseEntry.findMany({
        where: { branchId, entryDate: { gte: dayStart, lte: dayEnd } },
        orderBy: { entryDate: 'asc' },
        include: { createdBy: { select: { id: true, displayName: true } } },
      }),
      computeOpeningBalance(branchId, dayStart),
    ])

    const handovers    = entries.filter((e) => e.entryType === 'HANDOVER').reduce((s, e) => s + Number(e.amount), 0)
    const expenseTotal = entries.filter((e) => e.entryType === 'EXPENSE').reduce((s, e) => s + Number(e.amount), 0)
    const onlineAlloc  = entries.filter((e) => e.entryType === 'ONLINE_ALLOCATION').reduce((s, e) => s + Number(e.amount), 0)

    const onlineByMethod = onlineByMethodRaw.map((r) => ({
      paymentMethod: r.paymentMethod,
      amount: Number(r._sum.amount ?? 0),
      count: r._count,
    }))

    const totalCashAvailable = openingBalance + cashCollected
    const closingBalance = totalCashAvailable - handovers - expenseTotal

    return ok(res, {
      branch, date,
      openingBalance, cashCollected, onlineCollected, onlineByMethod,
      totalCashAvailable, handovers, expenses: expenseTotal, onlineAllocations: onlineAlloc,
      closingBalance, isNegative: closingBalance < 0,
      entries,
    })
  } catch (err) {
    console.error('[expenses] getReconciliation failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/online-summary — per-method totals with settlement status ──

async function getOnlineSummary(req, res) {
  try {
    const { branchId } = req.query

    const txWhere = {
      paymentMethod: { in: ONLINE_PAYMENT_METHODS },
      status: PAID_STATUSES,
      ...(branchId ? { branchId } : {}),
    }
    const stWhere = branchId ? { branchId } : {}

    const [byMethod, settlementsByMethod] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: txWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.onlineSettlement.groupBy({
        by: ['paymentMethod'],
        where: stWhere,
        _sum: { amountSettled: true },
        _count: true,
      }),
    ])

    const settledMap = Object.fromEntries(
      settlementsByMethod.map((s) => [s.paymentMethod, Number(s._sum.amountSettled ?? 0)])
    )

    const rows = byMethod.map((r) => {
      const totalCollected = Number(r._sum.amount ?? 0)
      const totalSettled = settledMap[r.paymentMethod] ?? 0
      return {
        paymentMethod: r.paymentMethod,
        totalCollected,
        totalSettled,
        pendingAmount: Math.max(0, totalCollected - totalSettled),
        transactionCount: r._count,
      }
    })

    const grandTotal   = rows.reduce((s, r) => s + r.totalCollected, 0)
    const grandSettled = rows.reduce((s, r) => s + r.totalSettled, 0)
    const grandPending = rows.reduce((s, r) => s + r.pendingAmount, 0)

    return ok(res, { rows, grandTotal, grandSettled, grandPending })
  } catch (err) {
    console.error('[expenses] getOnlineSummary failed', err)
    return serverError(res)
  }
}

// ─── POST /expenses/settlements ───────────────────────────────────────────────

async function createSettlement(req, res) {
  try {
    const { branchId, paymentMethod, amountSettled, settlementDate, utrNumber, notes } = req.body

    if (!ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      return badRequest(res, `Invalid paymentMethod for settlement`)
    }
    if (!amountSettled || Number(amountSettled) <= 0) {
      return badRequest(res, 'amountSettled must be greater than zero')
    }

    const settlement = await prisma.onlineSettlement.create({
      data: {
        branchId,
        paymentMethod,
        amountSettled: Number(amountSettled),
        settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
        utrNumber: utrNumber?.trim() || null,
        notes: notes?.trim() || null,
        settledById: req.user.id,
      },
      include: { settledBy: { select: { id: true, displayName: true } } },
    })

    return created(res, settlement)
  } catch (err) {
    console.error('[expenses] createSettlement failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/settlements ────────────────────────────────────────────────

async function listSettlements(req, res) {
  try {
    const { branchId, paymentMethod } = req.query
    const where = {
      ...(branchId ? { branchId } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }
    const settlements = await prisma.onlineSettlement.findMany({
      where,
      orderBy: { settlementDate: 'desc' },
      include: { settledBy: { select: { id: true, displayName: true } } },
    })
    return ok(res, settlements)
  } catch (err) {
    console.error('[expenses] listSettlements failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/summary ────────────────────────────────────────────────────

async function getSummary(req, res) {
  try {
    const { branchId, period, dateFrom, dateTo } = req.query

    let start, end
    const now = new Date()

    if (period === 'week') {
      const day = now.getDay()
      start = new Date(now)
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (period === 'all') {
      start = new Date('2020-01-01T00:00:00.000Z')
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    } else if (dateFrom && dateTo) {
      start = new Date(dateFrom)
      start.setHours(0, 0, 0, 0)
      end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
    } else {
      return badRequest(res, 'Provide period=week|month|all or dateFrom and dateTo')
    }

    const txFilter = {
      ...(branchId ? { branchId } : {}),
      status: PAID_STATUSES,
      paidAt: { gte: start, lte: end },
    }

    const conditions = [{ entryDate: { gte: start, lte: end } }]
    if (branchId) conditions.push({ branchId })
    const where = { AND: conditions }

    const [entries, cashCollectedResult, onlineCollectedResult] = await Promise.all([
      prisma.expenseEntry.findMany({
        where,
        include: { branch: { select: { id: true, name: true, code: true } } },
      }),
      prisma.transaction.aggregate({
        where: { ...txFilter, paymentMethod: 'CASH' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...txFilter, paymentMethod: { in: ONLINE_PAYMENT_METHODS } },
        _sum: { amount: true },
      }),
    ])

    const byType = entries.reduce((acc, e) => {
      acc[e.entryType] = (acc[e.entryType] ?? 0) + Number(e.amount)
      return acc
    }, {})

    const byCategory = entries
      .filter((e) => e.entryType === 'EXPENSE')
      .reduce((acc, e) => {
        const cat = e.category ?? 'MISCELLANEOUS'
        acc[cat] = (acc[cat] ?? 0) + Number(e.amount)
        return acc
      }, {})

    const byRecipient = entries
      .filter((e) => e.entryType === 'HANDOVER')
      .reduce((acc, e) => {
        const key = e.recipient ?? 'Unknown'
        acc[key] = (acc[key] ?? 0) + Number(e.amount)
        return acc
      }, {})

    return ok(res, {
      period: period ?? 'custom',
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      totalCashCollected: Number(cashCollectedResult._sum.amount ?? 0),
      totalOnlineCollected: Number(onlineCollectedResult._sum.amount ?? 0),
      totalHandovers: byType.HANDOVER ?? 0,
      totalExpenses: byType.EXPENSE ?? 0,
      totalOnlineAllocations: byType.ONLINE_ALLOCATION ?? 0,
      byCategory,
      byRecipient,
    })
  } catch (err) {
    console.error('[expenses] getSummary failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/branch-methods ────────────────────────────────────────────

async function getBranchMethods(req, res) {
  try {
    const { branchId } = req.query
    if (!branchId) return badRequest(res, 'branchId is required')
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, paymentMethods: true },
    })
    if (!branch) return notFound(res, 'Branch not found')
    return ok(res, { branchId: branch.id, paymentMethods: resolveBranchPaymentMethods(branch) })
  } catch (err) {
    console.error('[expenses] getBranchMethods failed', err)
    return serverError(res)
  }
}

// ─── PATCH /expenses/branch-methods ──────────────────────────────────────────

async function updateBranchMethods(req, res) {
  try {
    const { branchId, paymentMethods } = req.body
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin only' })
    }
    if (!branchId) return badRequest(res, 'branchId is required')
    if (!Array.isArray(paymentMethods)) return badRequest(res, 'paymentMethods must be an array')
    const VALID_ONLINE = new Set([
      'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
      'UPI_RAJANI', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_BHARATHI',
      'BANK_TRANSFER', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER',
      'GPAY', 'PHONEPE', 'PAYTM', 'ONLINE',
    ])
    const invalid = paymentMethods.filter((m) => !VALID_ONLINE.has(m))
    if (invalid.length > 0) return badRequest(res, `Invalid payment methods: ${invalid.join(', ')}`)
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: { paymentMethods },
      select: { id: true, name: true, paymentMethods: true },
    })
    return ok(res, { branchId: branch.id, paymentMethods: branch.paymentMethods })
  } catch (err) {
    console.error('[expenses] updateBranchMethods failed', err)
    return serverError(res)
  }
}

// ─── GET /expenses/recipients ─────────────────────────────────────────────────

async function getRecipients(req, res) {
  try {
    const { branchId } = req.query

    const where = {
      isActive: true,
      AND: branchId
        ? [{ OR: [{ branchId }, { branchId: null }] }]
        : [],
    }

    const recipients = await prisma.expenseRecipient.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, branchId: true, sortOrder: true },
    })

    return ok(res, recipients)
  } catch (err) {
    console.error('[expenses] getRecipients failed', err)
    return serverError(res)
  }
}

// ─── POST /expenses/recipients ────────────────────────────────────────────────

async function createRecipient(req, res) {
  try {
    const { name, branchId, sortOrder } = req.body
    const recipient = await prisma.expenseRecipient.create({
      data: {
        name: name.trim(),
        branchId: branchId ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    })
    return created(res, recipient)
  } catch (err) {
    if (err.code === 'P2002') return badRequest(res, 'Recipient already exists')
    console.error('[expenses] createRecipient failed', err)
    return serverError(res)
  }
}

// ─── PATCH /expenses/recipients/:id ──────────────────────────────────────────

async function updateRecipient(req, res) {
  try {
    const { id } = req.params
    const { name, isActive, sortOrder } = req.body

    const existing = await prisma.expenseRecipient.findUnique({ where: { id } })
    if (!existing) return notFound(res, 'Recipient not found')

    const updated = await prisma.expenseRecipient.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    })
    return ok(res, updated)
  } catch (err) {
    console.error('[expenses] updateRecipient failed', err)
    return serverError(res)
  }
}

module.exports = {
  getDashboard,
  listEntries,
  createEntry,
  updateEntryStatus,
  getDailyPosition,
  getReconciliation,
  getOnlineSummary,
  getSummary,
  getRecipients,
  createRecipient,
  updateRecipient,
  createSettlement,
  listSettlements,
  getBranchMethods,
  updateBranchMethods,
}
