'use strict'
const prisma = require('../../services/prisma')
const { ok, created, badRequest, notFound, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute total cash collected (CASH payment method) from the Transaction table
 * for a given branch and date range.
 */
async function fetchCashCollected(branchId, dateFrom, dateTo) {
  const result = await prisma.transaction.aggregate({
    where: {
      branchId,
      paymentMethod: 'CASH',
      status: 'PAID',
      paidAt: { gte: dateFrom, lte: dateTo },
    },
    _sum: { amount: true },
  })
  return Number(result._sum.amount ?? 0)
}

/**
 * Compute running balance up to (but not including) the given date.
 * openingBalance(date) = sum of all prior cash collected − sum of all prior HANDOVER and EXPENSE entries.
 * Floor at 0 to prevent negative opening balances from bad data.
 */
async function computeOpeningBalance(branchId, beforeDate) {
  const [cashIn, cashOut] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        branchId,
        paymentMethod: 'CASH',
        status: 'PAID',
        paidAt: { lt: beforeDate },
      },
      _sum: { amount: true },
    }),
    prisma.expenseEntry.aggregate({
      where: {
        branchId,
        entryType: { in: ['HANDOVER', 'EXPENSE'] },
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
  const [cashCollected, todayEntries, openingBalance] = await Promise.all([
    fetchCashCollected(branchId, todayStart, todayEnd),
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
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, displayName: true } },
          branch: { select: { id: true, name: true, code: true } },
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
      recipient, category, description, referenceId, notes, entryDate,
    } = req.body

    const entry = await prisma.expenseEntry.create({
      data: {
        branchId,
        entryType,
        amount,
        paymentMethod,
        recipient: recipient ?? null,
        category: category ?? null,
        description: description ?? null,
        referenceId: referenceId ?? null,
        notes: notes ?? null,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    })

    return created(res, entry)
  } catch (err) {
    console.error('[expenses] createEntry failed', err)
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

    const [cashCollected, entries, openingBalance] = await Promise.all([
      fetchCashCollected(branchId, dayStart, dayEnd),
      prisma.expenseEntry.findMany({
        where: { branchId, entryDate: { gte: dayStart, lte: dayEnd } },
        orderBy: { entryDate: 'asc' },
        include: { createdBy: { select: { id: true, displayName: true } } },
      }),
      computeOpeningBalance(branchId, dayStart),
    ])

    const handovers = entries
      .filter((e) => e.entryType === 'HANDOVER')
      .reduce((s, e) => s + Number(e.amount), 0)
    const expenseTotal = entries
      .filter((e) => e.entryType === 'EXPENSE')
      .reduce((s, e) => s + Number(e.amount), 0)
    const onlineTotal = entries
      .filter((e) => e.entryType === 'ONLINE_ALLOCATION')
      .reduce((s, e) => s + Number(e.amount), 0)

    const totalCashAvailable = openingBalance + cashCollected
    const closingBalance = totalCashAvailable - handovers - expenseTotal

    return ok(res, {
      branch,
      date,
      openingBalance,
      cashCollected,
      totalCashAvailable,
      handovers,
      expenses: expenseTotal,
      onlineAllocations: onlineTotal,
      closingBalance,
      isNegative: closingBalance < 0,
      entries,
    })
  } catch (err) {
    console.error('[expenses] getReconciliation failed', err)
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
    } else if (dateFrom && dateTo) {
      start = new Date(dateFrom)
      start.setHours(0, 0, 0, 0)
      end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
    } else {
      return badRequest(res, 'Provide period=week|month or dateFrom and dateTo')
    }

    const conditions = [{ entryDate: { gte: start, lte: end } }]
    if (branchId) conditions.push({ branchId })
    const where = { AND: conditions }

    const [entries, cashCollectedResult] = await Promise.all([
      prisma.expenseEntry.findMany({
        where,
        include: { branch: { select: { id: true, name: true, code: true } } },
      }),
      prisma.transaction.aggregate({
        where: {
          ...(branchId ? { branchId } : {}),
          paymentMethod: 'CASH',
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
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
  getReconciliation,
  getSummary,
  getRecipients,
  createRecipient,
  updateRecipient,
}
