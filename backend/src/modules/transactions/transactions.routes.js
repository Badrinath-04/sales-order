const { Router } = require('express')
const ctrl = require('./transactions.controller')
const {
  authenticate,
  enforceBranchScope,
  requireAnyPermission,
  requireTransactionHistoryAccess,
  enforceTransactionDateRange,
} = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/', requireTransactionHistoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.list)
router.get('/kpis', requireTransactionHistoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.getKpis)
router.get('/dues', requireTransactionHistoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.listDues)
router.get('/students', requireTransactionHistoryAccess, enforceTransactionDateRange, enforceBranchScope, ctrl.listByStudent)
router.get('/:id', requireAnyPermission('canViewStudentPurchaseDetails', 'canViewTransactions7Days', 'canViewTransactionsAllTime'), ctrl.getOne)

module.exports = router
