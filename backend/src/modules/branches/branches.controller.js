const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response')

async function list(req, res) {
  try {
    const cacheKey = 'branches:all'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    cache.set(cacheKey, branches, cache.TTL.LONG)
    return ok(res, branches)
  } catch {
    return serverError(res)
  }
}

async function create(req, res) {
  try {
    const { name, code, type, address, phone, email } = req.body
    if (!name || !code) return badRequest(res, 'name and code are required')

    const branch = await prisma.branch.create({ data: { name, code: code.toUpperCase(), type, address, phone, email } })
    cache.del('branches:all')
    return created(res, branch)
  } catch (err) {
    if (err.code === 'P2002') return badRequest(res, 'Branch code already exists')
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } })
    if (!branch) return notFound(res, 'Branch not found')
    return ok(res, branch)
  } catch {
    return serverError(res)
  }
}

async function update(req, res) {
  try {
    const { name, address, phone, email, isActive } = req.body
    const branch = await prisma.branch.update({
      where: { id: req.params.branchId },
      data: { name, address, phone, email, isActive },
    })
    cache.del('branches:all')
    return ok(res, branch)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Branch not found')
    return serverError(res)
  }
}

async function getKpis(req, res) {
  try {
    const branchId = req.params.branchId
    const cacheKey = `branch:${branchId}:kpis`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [revenueToday, ordersToday, pendingPayments, totalStudents] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { branchId, paidAt: { gte: today } },
      }),
      prisma.order.count({ where: { branchId, createdAt: { gte: today } } }),
      prisma.order.count({ where: { branchId, paymentStatus: 'PARTIAL' } }),
      prisma.students.count({ where: { class: { branchId }, isActive: true } }),
    ])

    const data = {
      revenueToday: Number(revenueToday._sum.amount || 0),
      ordersToday,
      pendingPayments,
      totalStudents,
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function getClasses(req, res) {
  try {
    const classes = await prisma.academicClass.findMany({
      where: { branchId: req.params.branchId },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      include: { _count: { select: { students: true } } },
    })
    return ok(res, classes)
  } catch {
    return serverError(res)
  }
}

async function createClass(req, res) {
  try {
    const { grade, section, academicYear } = req.body
    if (!grade || !section) return badRequest(res, 'grade and section are required')
    const label = `Class ${grade}-${section}`
    const cls = await prisma.academicClass.create({
      data: { grade: parseInt(grade), section, label, branchId: req.params.branchId, academicYear },
    })
    return created(res, cls)
  } catch (err) {
    if (err.code === 'P2002') return badRequest(res, 'Class already exists for this branch and year')
    return serverError(res)
  }
}

async function getStudents(req, res) {
  try {
    const { payment, books, uniform } = req.query
    const where = { classId: req.params.classId, isActive: true }

    const students = await prisma.students.findMany({
      where,
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { paymentStatus: true, bookStatus: true, uniformStatus: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Apply status filters from latest order
    const filtered = students.filter((s) => {
      const latest = s.orders[0]
      if (!latest) return true
      if (payment && payment !== 'all') {
        if (payment === 'paid' && latest.paymentStatus !== 'PAID') return false
        if (payment === 'unpaid' && latest.paymentStatus !== 'UNPAID') return false
        if (payment === 'partial' && latest.paymentStatus !== 'PARTIAL') return false
      }
      return true
    })

    return ok(res, filtered)
  } catch {
    return serverError(res)
  }
}

module.exports = { list, create, getOne, update, getKpis, getClasses, createClass, getStudents }
