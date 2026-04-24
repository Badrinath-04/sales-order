const { Router } = require('express')
const ctrl = require('./inventory.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

// KPI summary
router.get('/kpis', enforceBranchScope, ctrl.getKpis)

// Books
router.get('/books', enforceBranchScope, ctrl.listBooks)
router.get('/books/:kitId', enforceBranchScope, ctrl.getBookKit)
router.patch('/books/:kitId/stock', requireSuperAdmin, ctrl.updateBookStock)

// Uniforms
router.get('/uniforms/categories', ctrl.listUniformCategories)
router.get('/uniforms', enforceBranchScope, ctrl.listUniforms)
router.patch('/uniforms/:sizeId/stock', requireSuperAdmin, ctrl.updateUniformStock)

// Accessories
router.get('/accessories', ctrl.listAccessoryGroups)

// History / audit log
router.get('/logs', enforceBranchScope, ctrl.getLogs)

module.exports = router
