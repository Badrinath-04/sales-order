const { Router } = require('express')
const ctrl = require('./reports.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/finance-summary', enforceBranchScope, ctrl.financeSummary)
router.get('/branch-performance', requireSuperAdmin, ctrl.branchPerformance)
router.get('/sales-trend', enforceBranchScope, ctrl.salesTrend)
router.get('/super-dashboard', requireSuperAdmin, ctrl.superDashboard)
router.get('/admin-dashboard', enforceBranchScope, ctrl.adminDashboard)

module.exports = router
