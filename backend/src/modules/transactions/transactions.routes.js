const { Router } = require('express')
const ctrl = require('./transactions.controller')
const { authenticate, enforceBranchScope } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/', enforceBranchScope, ctrl.list)
router.get('/kpis', enforceBranchScope, ctrl.getKpis)
router.get('/:id', ctrl.getOne)

module.exports = router
