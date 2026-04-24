const { Router } = require('express')
const ctrl = require('./orders.controller')
const { authenticate, enforceBranchScope } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

router.get('/', enforceBranchScope, ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.patch('/:id', ctrl.update)
router.post('/:id/payment', ctrl.processPayment)
router.delete('/:id', ctrl.cancel)

module.exports = router
