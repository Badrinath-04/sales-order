const { Router } = require('express')
const ctrl = require('./inventory.controller')
const { authenticate, requireSuperAdmin, enforceBranchScope, requirePermission } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

// KPI summary
router.get('/kpis', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.getKpis)

// Books
router.get('/books', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.listBooks)
router.get('/books/:kitId', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.getBookKit)
router.patch('/books/:kitId/stock', requirePermission('canAdjustStock'), ctrl.updateBookStock)
router.post('/books/bulk-adjust', requirePermission('canBulkEditStock'), ctrl.bulkAdjustBookStock)

// Product (BookKitItem) CRUD
router.post('/products', requirePermission('canCreateProducts'), ctrl.createProduct)
router.patch('/products/:itemId', requirePermission('canCreateProducts'), ctrl.updateProduct)
router.delete('/products/:itemId', requirePermission('canArchiveProducts'), ctrl.archiveProduct)
router.patch('/products/:itemId/restore', requirePermission('canArchiveProducts'), ctrl.restoreProduct)

// Uniforms
router.get('/uniforms/categories', requirePermission('canUpdateStock'), ctrl.listUniformCategories)
router.get('/uniforms', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.listUniforms)
router.post('/uniforms/products', requirePermission('canCreateProducts'), ctrl.createUniformProduct)
router.patch('/uniforms/products/:categoryId', requirePermission('canCreateProducts'), ctrl.updateUniformProduct)
router.post('/uniforms/bulk-adjust', requirePermission('canBulkEditStock'), ctrl.bulkAdjustUniformStock)
router.patch('/uniforms/:sizeId/stock', requirePermission('canAdjustStock'), ctrl.updateUniformStock)

// Accessories
router.get('/accessories', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.listAccessoryGroups)
router.patch('/accessories/:accessoryId/stock', requirePermission('canAdjustStock'), ctrl.updateAccessoryStock)

// History / audit log
router.get('/logs', requirePermission('canViewStockLogs'), enforceBranchScope, ctrl.getLogs)

module.exports = router
