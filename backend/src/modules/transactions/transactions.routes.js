const { Router } = require('express')
const ctrl = require('./transactions.controller')
const {
  authenticate,
  enforceBranchScope,
  requireAnyPermission,
  requireTransactionHistoryAccess,
  enforceTransactionDateRange,
  currentPermissionValue,
} = require('../../middleware/auth')
const { forbidden } = require('../../utils/response')

const router = Router()

router.use(authenticate)

/**
 * Category-aware access control: when ?itemCategory=books|uniforms is present,
 * verify the user has the corresponding granular permission in addition to base
 * transaction history access. Super Admins bypass all checks.
 */
async function requireCategoryAccess(req, res, next) {
  if (req.user?.role === 'SUPER_ADMIN') return next()
  const { itemCategory } = req.query
  if (!itemCategory) return next()

  const CATEGORY_PERM = { books: 'canViewBooksTransactions', uniforms: 'canViewUniformTransactions' }
  const permKey = CATEGORY_PERM[itemCategory] ?? null

  if (!permKey) return next()

  try {
    const allowed = await currentPermissionValue(req.user, permKey)
    if (!allowed) return forbidden(res, 'Permission denied for this transaction category')
    next()
  } catch (err) {
    next(err)
  }
}

router.get('/', requireTransactionHistoryAccess, requireCategoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.list)
router.get('/kpis', requireTransactionHistoryAccess, requireCategoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.getKpis)
router.get('/dues', requireTransactionHistoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.listDues)
router.get('/students', requireTransactionHistoryAccess, requireCategoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.listByStudent)
router.get('/:id', requireAnyPermission('canViewStudentPurchaseDetails', 'canViewTransactions7Days', 'canViewTransactionsAllTime'), ctrl.getOne)

module.exports = router
