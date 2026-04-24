const { Router } = require('express')
const { login, logout, me, refresh } = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')

const router = Router()

router.post('/login', login)
router.post('/logout', authenticate, logout)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)

module.exports = router
