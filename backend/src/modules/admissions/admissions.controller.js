const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, badRequest, serverError } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

function scheduleAdmissionCacheInvalidation(branchId) {
  setImmediate(() => {
    try {
      if (branchId) cache.delByPrefix(`admissions:branch:${branchId}`)
      cache.delByPrefix('admissions')
    } catch (err) {
      console.error('[admissions] cache invalidation failed', err?.message)
    }
  })
}

function genAdmissionCode() {
  const now = new Date()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ADM-${now.getFullYear()}-${rand}`
}

function buildAdmissionWhere(query) {
  const { search, status, grade, section, branchId } = query
  const conditions = []

  if (branchId) conditions.push({ branchId })
  if (status) conditions.push({ paymentStatus: status })
  if (grade != null && grade !== '') {
    const gradeNum = Number(grade)
    if (!Number.isNaN(gradeNum)) conditions.push({ grade: gradeNum })
  }
  if (section) conditions.push({ section })
  if (search) {
    conditions.push({
      OR: [
        { studentName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { admissionCode: { contains: search, mode: 'insensitive' } },
      ],
    })
  }

  return conditions.length ? { AND: conditions } : {}
}

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const where = buildAdmissionWhere(req.query)

    const [rows, total, summary] = await Promise.all([
      prisma.admissionStudent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          transactions: { orderBy: { paidAt: 'desc' }, take: 1 },
        },
      }),
      prisma.admissionStudent.count({ where }),
      prisma.admissionStudent.groupBy({
        by: ['paymentStatus'],
        where,
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ])

    const summaryTotals = summary.reduce(
      (acc, row) => {
        acc.totalStudents += row._count._all
        if (row.paymentStatus === 'PAID') {
          acc.totalCollected += Number(row._sum.amount ?? 0)
        } else {
          acc.pendingCount += row._count._all
        }
        return acc
      },
      { totalStudents: 0, totalCollected: 0, pendingCount: 0 },
    )

    return ok(res, { admissions: rows, summary: summaryTotals }, buildMeta(total, page, limit))
  } catch (err) {
    console.error('[admissions] list failed', err)
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    const row = await prisma.admissionStudent.findUnique({
      where: { id: req.params.id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        transactions: { orderBy: { paidAt: 'desc' } },
      },
    })
    if (!row) return notFound(res, 'Admission record not found')
    return ok(res, row)
  } catch (err) {
    console.error('[admissions] getOne failed', err)
    return serverError(res)
  }
}

async function create(req, res) {
  try {
    const { studentName, parentName, phone, grade, section, classLabel, branchId, amount, remarks } = req.body

    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } })
    if (!branch) return badRequest(res, 'Invalid branch')

    let admissionCode = genAdmissionCode()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await prisma.admissionStudent.findUnique({ where: { admissionCode } })
      if (!exists) break
      admissionCode = genAdmissionCode()
    }

    const row = await prisma.admissionStudent.create({
      data: {
        admissionCode,
        studentName,
        parentName: parentName || null,
        phone,
        grade,
        section,
        classLabel,
        branchId,
        amount,
        remarks: remarks || null,
        paymentStatus: 'PENDING',
        createdById: req.user.id,
      },
      include: { branch: { select: { id: true, name: true, code: true } } },
    })

    scheduleAdmissionCacheInvalidation(branchId)
    return created(res, row)
  } catch (err) {
    console.error('[admissions] create failed', err)
    return serverError(res)
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.admissionStudent.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res, 'Admission record not found')

    const { studentName, parentName, phone, amount, remarks } = req.body
    const row = await prisma.admissionStudent.update({
      where: { id: req.params.id },
      data: {
        ...(studentName === undefined ? {} : { studentName }),
        ...(parentName === undefined ? {} : { parentName }),
        ...(phone === undefined ? {} : { phone }),
        ...(amount === undefined ? {} : { amount }),
        ...(remarks === undefined ? {} : { remarks }),
      },
      include: { branch: { select: { id: true, name: true, code: true } } },
    })

    scheduleAdmissionCacheInvalidation(row.branchId)
    return ok(res, row)
  } catch (err) {
    console.error('[admissions] update failed', err)
    return serverError(res)
  }
}

async function processPayment(req, res) {
  try {
    const { paymentMethod, amount, splitDetails, remarks } = req.body

    const admission = await prisma.admissionStudent.findUnique({ where: { id: req.params.id } })
    if (!admission) return notFound(res, 'Admission record not found')
    if (admission.paymentStatus === 'PAID') {
      return badRequest(res, 'This admission has already been paid')
    }

    if (paymentMethod === 'SPLIT') {
      if (!Array.isArray(splitDetails) || splitDetails.length < 2) {
        return badRequest(res, 'splitDetails must include at least two payment entries for a split payment')
      }
      const splitSum = splitDetails.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
      if (Math.abs(splitSum - Number(amount)) > 0.01) {
        return badRequest(res, 'Split payment entries must add up to the total amount')
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.admissionTransaction.create({
        data: {
          admissionId: admission.id,
          branchId: admission.branchId,
          amount,
          paymentMethod,
          splitDetails: paymentMethod === 'SPLIT' ? splitDetails : undefined,
          remarks: remarks || null,
          processedById: req.user.id,
        },
      })

      const updatedAdmission = await tx.admissionStudent.update({
        where: { id: admission.id },
        data: { paymentStatus: 'PAID' },
        include: { branch: { select: { id: true, name: true, code: true } } },
      })

      return { transaction, admission: updatedAdmission }
    })

    scheduleAdmissionCacheInvalidation(admission.branchId)
    return created(res, result)
  } catch (err) {
    console.error('[admissions] processPayment failed', err)
    return serverError(res)
  }
}

function buildAdmissionTransactionWhere(query) {
  const { search, paymentMethod, grade, section, branchId, dateFrom, dateTo } = query
  const conditions = []

  if (branchId) conditions.push({ branchId })
  if (paymentMethod) conditions.push({ paymentMethod })
  if (grade != null && grade !== '' || section) {
    const admissionFilter = {}
    if (grade != null && grade !== '') {
      const gradeNum = Number(grade)
      if (!Number.isNaN(gradeNum)) admissionFilter.grade = gradeNum
    }
    if (section) admissionFilter.section = section
    conditions.push({ admission: admissionFilter })
  }
  if (dateFrom || dateTo) {
    const paidAt = {}
    if (dateFrom) paidAt.gte = new Date(dateFrom)
    if (dateTo) paidAt.lte = new Date(dateTo)
    conditions.push({ paidAt })
  }
  if (search) {
    conditions.push({
      OR: [
        { admission: { studentName: { contains: search, mode: 'insensitive' } } },
        { admission: { phone: { contains: search, mode: 'insensitive' } } },
        { admission: { admissionCode: { contains: search, mode: 'insensitive' } } },
      ],
    })
  }

  return conditions.length ? { AND: conditions } : {}
}

async function listTransactions(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const where = buildAdmissionTransactionWhere(req.query)

    const [rows, total] = await Promise.all([
      prisma.admissionTransaction.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
        include: {
          admission: { select: { id: true, admissionCode: true, studentName: true, classLabel: true, grade: true, section: true } },
          branch: { select: { id: true, name: true, code: true } },
          processedBy: { select: { id: true, displayName: true } },
        },
      }),
      prisma.admissionTransaction.count({ where }),
    ])

    return ok(res, { transactions: rows }, buildMeta(total, page, limit))
  } catch (err) {
    console.error('[admissions] listTransactions failed', err)
    return serverError(res)
  }
}

async function getSettings(req, res) {
  try {
    const branchId = req.query.branchId || null
    let settings = branchId
      ? await prisma.admissionSettings.findUnique({ where: { branchId } })
      : null
    if (!settings) {
      settings = await prisma.admissionSettings.findFirst({ where: { branchId: null } })
    }
    return ok(res, { defaultAmount: Number(settings?.defaultAmount ?? 500), branchId: settings?.branchId ?? null })
  } catch (err) {
    console.error('[admissions] getSettings failed', err)
    return serverError(res)
  }
}

async function updateSettings(req, res) {
  try {
    const { defaultAmount, branchId } = req.body
    const targetBranchId = branchId || null

    // `branchId` is nullable+unique; Postgres allows multiple NULLs so we resolve the
    // singleton global row manually instead of relying on upsert-by-null.
    const existing = targetBranchId
      ? await prisma.admissionSettings.findUnique({ where: { branchId: targetBranchId } })
      : await prisma.admissionSettings.findFirst({ where: { branchId: null } })

    const settings = existing
      ? await prisma.admissionSettings.update({ where: { id: existing.id }, data: { defaultAmount } })
      : await prisma.admissionSettings.create({ data: { branchId: targetBranchId, defaultAmount } })

    cache.delByPrefix('admissions')
    return ok(res, { defaultAmount: Number(settings.defaultAmount), branchId: settings.branchId })
  } catch (err) {
    console.error('[admissions] updateSettings failed', err)
    return serverError(res)
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  processPayment,
  listTransactions,
  getSettings,
  updateSettings,
}
