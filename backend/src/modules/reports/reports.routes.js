const { Router } = require('express')
const ctrl = require('./reports.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope, requirePermission } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/branch-performance', requirePermission('canViewReports'), enforceBranchScope, ctrl.branchPerformance)
router.get('/sales-trend', requirePermission('canViewReports'), enforceBranchScope, ctrl.salesTrend)
router.get('/super-dashboard', requireSuperAdmin, ctrl.superDashboard)
router.get('/admin-dashboard', requirePermission('canViewReports'), enforceBranchScope, ctrl.adminDashboard)

module.exports = router
