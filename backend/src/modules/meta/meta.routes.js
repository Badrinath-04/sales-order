const { Router } = require('express')
const ctrl = require('./meta.controller')
const { authenticate } = require('../../middleware/auth')

const router = Router()
router.use(authenticate)
router.get('/catalog', ctrl.catalog)

module.exports = router
