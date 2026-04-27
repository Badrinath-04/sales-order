const { Router } = require('express')
const ctrl = require('./admin.controller')
const { authenticate, requireSuperAdmin } = require('../../middleware/auth')

const router = Router()
router.use(authenticate, requireSuperAdmin)

router.get('/', ctrl.listAdmins)
router.post('/', ctrl.createAdmin)
router.patch('/:adminId', ctrl.updateAdmin)
router.post('/:adminId/reset-password', ctrl.resetPassword)

module.exports = router
