const prisma = require('../../services/prisma')
const { ok, serverError } = require('../../utils/response')
const { classLabelForGrade } = require('../../utils/schoolGrades')
const { OPERATIONAL_BRANCH_FILTER } = require('../../utils/operationalBranch')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

// Hardcoded fallbacks — used when the referenceOption table has not been seeded yet.
const DEFAULT_PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CANARA_UPI', label: 'Canara Bank UPI' },
  { value: 'UPI_BHARATH', label: 'UPI to Bharath Kumar' },
  { value: 'UPI_POORNIMA', label: 'UPI to Poornima' },
  { value: 'UPI_RAJANI', label: 'UPI To Rajani' },
  { value: 'UPI_VARALAXMI', label: 'UPI To Varalaxmi' },
  { value: 'UPI_INDU', label: 'UPI To Indu' },
  { value: 'UPI_BHARATHI', label: 'UPI To Bharathi' },
  { value: 'BOB_UPI', label: 'BOB UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'GPAY', label: 'Google Pay' },
  { value: 'PHONEPE', label: 'PhonePe' },
  { value: 'PAYTM', label: 'Paytm' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'OTHER', label: 'Other' },
]

const DEFAULT_PAYMENT_STATUSES = [
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'UNPAID', label: 'Unpaid' },
]

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
      paymentMethods: paymentRows.length
        ? paymentRows.map((r) => ({ value: r.code, label: r.label }))
        : DEFAULT_PAYMENT_METHODS,
      paymentStatuses: statusRows.length
        ? statusRows.map((r) => ({ value: r.code, label: r.label }))
        : DEFAULT_PAYMENT_STATUSES,
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
