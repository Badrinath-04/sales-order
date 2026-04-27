const { Router } = require('express')
const ctrl = require('./inventory.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope, requirePermission } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

// KPI summary
router.get('/kpis', enforceBranchScope, ctrl.getKpis)

// Books
router.get('/books', enforceBranchScope, ctrl.listBooks)
router.get('/books/:kitId', enforceBranchScope, ctrl.getBookKit)
router.patch('/books/:kitId/stock', requirePermission('canAdjustStock'), ctrl.updateBookStock)
router.post('/books/bulk-adjust', requireSuperAdmin, ctrl.bulkAdjustBookStock)

// Product (BookKitItem) CRUD
router.post('/products', requirePermission('canCreateProducts'), ctrl.createProduct)
router.patch('/products/:itemId', requirePermission('canCreateProducts'), ctrl.updateProduct)
router.delete('/products/:itemId', requireSuperAdmin, ctrl.archiveProduct)

// Uniforms
router.get('/uniforms/categories', ctrl.listUniformCategories)
router.get('/uniforms', enforceBranchScope, ctrl.listUniforms)
router.patch('/uniforms/:sizeId/stock', requirePermission('canAdjustStock'), ctrl.updateUniformStock)

// Accessories
router.get('/accessories', enforceBranchScope, ctrl.listAccessoryGroups)
router.patch('/accessories/:accessoryId/stock', requirePermission('canAdjustStock'), ctrl.updateAccessoryStock)

// History / audit log
router.get('/logs', requirePermission('canViewStockLogs'), enforceBranchScope, ctrl.getLogs)

module.exports = router
