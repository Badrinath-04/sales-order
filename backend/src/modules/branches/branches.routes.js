const { Router } = require('express')
const ctrl = require('./branches.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', requireSuperAdmin, ctrl.create)
router.get('/:branchId', enforceBranchScope, ctrl.getOne)
router.patch('/:branchId', requireSuperAdmin, ctrl.update)
router.get('/:branchId/kpis', enforceBranchScope, ctrl.getKpis)
router.get('/:branchId/classes', enforceBranchScope, ctrl.getClasses)
router.post('/:branchId/classes', requireSuperAdmin, ctrl.createClass)
router.get('/:branchId/classes/:classId/students', enforceBranchScope, ctrl.getStudents)

module.exports = router
