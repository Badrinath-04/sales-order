const { Router } = require('express')
const { z } = require('zod')
const { authenticate, requireSuperAdmin } = require('../../middleware/auth')
const validate = require('../../middleware/validate')
const { verifySuperPassword } = require('../admin-management/admin.controller')

const router = Router()

const verifyPasswordSchema = {
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
}

router.use(authenticate, requireSuperAdmin)
router.post('/verify-password', validate(verifyPasswordSchema), verifySuperPassword)

module.exports = router
