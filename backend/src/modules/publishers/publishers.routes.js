const { Router } = require('express')
const ctrl = require('./publishers.controller')
const { authenticate, requireSuperAdmin, requirePermission } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)

// Dashboard summary
router.get('/dashboard', requirePermission('canManagePublishers'), ctrl.getAccountsDashboard)

// Publisher CRUD
router.get('/', requirePermission('canManagePublishers'), ctrl.listPublishers)
router.get('/:id', requirePermission('canManagePublishers'), ctrl.getPublisher)
router.post('/', requireSuperAdmin, ctrl.createPublisher)
router.patch('/:id', requireSuperAdmin, ctrl.updatePublisher)

// Procurement
router.get('/procurements/list', requirePermission('canManagePublishers'), ctrl.listProcurements)
router.post('/procurements', requirePermission('canManagePublishers'), ctrl.createProcurement)

// Payments
router.post('/:publisherId/payments', requirePermission('canManagePublishers'), ctrl.addPayment)

module.exports = router
