const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response')

const MIN_GRADE = -2
const MAX_GRADE = 10

function classLabelForGrade(grade) {
  if (grade === -2) return 'Nursery'
  if (grade === -1) return 'LKG'
  if (grade === 0) return 'UKG'
  return `Class ${grade}`
}

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
      prisma.students.count({
        where: {
          class: { branchId, grade: { gte: MIN_GRADE, lte: MAX_GRADE } },
          isActive: true,
        },
      }),
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
      where: {
        branchId: req.params.branchId,
        grade: { gte: MIN_GRADE, lte: MAX_GRADE },
      },
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
    if (grade === undefined || grade === null || !section) return badRequest(res, 'grade and section are required')
    if (grade < MIN_GRADE || grade > MAX_GRADE) return badRequest(res, 'grade must be Nursery, LKG, UKG, or Class 1-10')
    const label = `${classLabelForGrade(grade)}-${section}`
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

async function createStudent(req, res) {
  try {
    const { classId, name, rollNumber, fatherName, contactNo, address } = req.body
    if (!classId || !name) return badRequest(res, 'classId and name are required')

    const cls = await prisma.academicClass.findUnique({ where: { id: classId } })
    if (!cls) return notFound(res, 'Class not found')

    const roll = rollNumber ?? String(Date.now()).slice(-6)
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

    const student = await prisma.students.create({
      data: { name, rollNumber: roll, initials, guardianName: fatherName ?? null, guardianPhone: contactNo ?? null, classId },
    })

    await prisma.academicClass.update({
      where: { id: classId },
      data: { studentCount: { increment: 1 } },
    })

    return created(res, student)
  } catch (err) {
    if (err.code === 'P2002') return badRequest(res, 'Roll number already exists in this class')
    return serverError(res)
  }
}

async function bulkCreateStudents(req, res) {
  try {
    const { classId, students } = req.body
    if (!classId || !Array.isArray(students) || students.length === 0) {
      return badRequest(res, 'classId and students array are required')
    }

    const cls = await prisma.academicClass.findUnique({ where: { id: classId } })
    if (!cls) return notFound(res, 'Class not found')

    let successCount = 0
    const errors = []

    for (const [i, s] of students.entries()) {
      if (!s.name) { errors.push({ row: i + 1, reason: 'Name is required' }); continue }
      const rollNumber = s.rollNumber ?? String(i + 1)
      const initials = s.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      try {
        await prisma.students.upsert({
          where: { rollNumber_classId: { rollNumber, classId } },
          update: { name: s.name, guardianName: s.fatherName ?? null, guardianPhone: s.contactNo ?? null },
          create: {
            name: s.name,
            rollNumber,
            initials,
            guardianName: s.fatherName ?? null,
            guardianPhone: s.contactNo ?? null,
            classId,
          },
        })
        successCount++
      } catch (err) {
        errors.push({ row: i + 1, reason: err.message })
      }
    }

    await prisma.academicClass.update({
      where: { id: classId },
      data: { studentCount: await prisma.students.count({ where: { classId, isActive: true } }) },
    })

    return ok(res, { successCount, errorCount: errors.length, errors })
  } catch {
    return serverError(res)
  }
}

module.exports = { list, create, getOne, update, getKpis, getClasses, createClass, getStudents, createStudent, bulkCreateStudents }
