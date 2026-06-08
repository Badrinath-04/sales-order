const { Router } = require('express')
const ctrl = require('./inventory.controller')
const { authenticate, enforceBranchScope, requirePermission, requireAnyPermission, currentPermissionValue } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

async function requireScopedLogPermission(req, res, next) {
  try {
    if (req.user?.role === 'SUPER_ADMIN') return next()
    const itemType = String(req.query.itemType ?? '').toUpperCase()
    if (itemType === 'UNIFORM') {
      if (await currentPermissionValue(req.user, 'canViewUniformStockLogs')) return next()
      return res.status(403).json({ success: false, message: 'Permission denied' })
    }
    if (await currentPermissionValue(req.user, 'canViewStockLogs')) return next()
    return res.status(403).json({ success: false, message: 'Permission denied' })
  } catch (err) {
    next(err)
  }
}

// KPI summary
router.get('/kpis', requireAnyPermission('canUpdateStock', 'canViewUniformStock'), enforceBranchScope, ctrl.getKpis)

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
router.get('/uniforms/categories', requirePermission('canViewUniformStock'), ctrl.listUniformCategories)
router.get('/uniforms', requirePermission('canViewUniformStock'), enforceBranchScope, ctrl.listUniforms)
router.post('/uniforms/products', requirePermission('canManageUniformCategories'), ctrl.createUniformProduct)
router.patch('/uniforms/products/:categoryId', requirePermission('canManageUniformCategories'), ctrl.updateUniformProduct)
router.post('/uniforms/bulk-adjust', requirePermission('canBulkEditUniformStock'), ctrl.bulkAdjustUniformStock)
router.patch('/uniforms/:sizeId/stock', requirePermission('canAdjustUniformStock'), ctrl.updateUniformStock)

// Accessories
router.get('/accessories', requirePermission('canUpdateStock'), enforceBranchScope, ctrl.listAccessoryGroups)
router.patch('/accessories/:accessoryId/stock', requirePermission('canAdjustStock'), ctrl.updateAccessoryStock)

// History / audit log
router.get('/logs', requireAnyPermission('canViewStockLogs', 'canViewUniformStockLogs'), enforceBranchScope, requireScopedLogPermission, ctrl.getLogs)

module.exports = router
