const { Router } = require('express')
const ctrl = require('./transfers.controller')
const { authenticate, requireSuperAdmin } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', requireSuperAdmin, ctrl.create)
router.get('/:id', ctrl.getOne)
router.patch('/:id/status', requireSuperAdmin, ctrl.updateStatus)

module.exports = router
