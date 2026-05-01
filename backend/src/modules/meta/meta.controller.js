const prisma = require('../../services/prisma')
const { ok, serverError } = require('../../utils/response')
const { classLabelForGrade } = require('../../utils/schoolGrades')
const { OPERATIONAL_BRANCH_FILTER } = require('../../utils/operationalBranch')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

async function catalog(req, res) {
  try {
    const requestedBranchId = req.query.branchId
    const fallbackBranchId = req.user.role !== 'SUPER_ADMIN' ? req.user.branchId : undefined
    const effectiveBranchId = requestedBranchId || fallbackBranchId

    const [paymentRows, statusRows, gradeRows] = await Promise.all([
      prisma.referenceOption.findMany({
        where: { category: 'PAYMENT_METHOD', isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.referenceOption.findMany({
        where: { category: 'TRANSACTION_PAYMENT_STATUS', isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.academicClass.findMany({
        where: {
          grade: SUPPORTED_CLASS_GRADE,
          ...(effectiveBranchId ? { branchId: String(effectiveBranchId) } : {}),
          branch: OPERATIONAL_BRANCH_FILTER,
        },
        distinct: ['grade'],
        orderBy: { grade: 'asc' },
        select: { grade: true },
      }),
    ])

    return ok(res, {
      paymentMethods: paymentRows.map((r) => ({ value: r.code, label: r.label })),
      paymentStatuses: statusRows.map((r) => ({ value: r.code, label: r.label })),
      classOptions: gradeRows.map((r) => ({
        value: String(r.grade),
        label: classLabelForGrade(r.grade),
      })),
    })
  } catch (err) {
    console.error(err)
    return serverError(res)
  }
}

module.exports = { catalog }
