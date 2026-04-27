const { Router } = require('express')
const { z } = require('zod')
const { login, logout, me, refresh } = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

const loginSchema = {
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
}

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
}

router.post('/login', validate(loginSchema), login)
router.post('/logout', authenticate, logout)
router.post('/refresh', validate(refreshSchema), refresh)
router.get('/me', authenticate, me)

module.exports = router
