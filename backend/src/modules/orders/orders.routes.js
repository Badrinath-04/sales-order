const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./orders.controller')
const { authenticate, enforceBranchScope, requirePermission, requireAnyPermission, currentPermissionValue } = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

async function requireOrderItemPermissions(req, res, next) {
  try {
    if (req.user?.role === 'SUPER_ADMIN') return next()
    const itemTypes = new Set((req.body?.items ?? []).map((item) => item.itemType))
    if (itemTypes.has('BOOK') && !(await currentPermissionValue(req.user, 'canPlaceOrders'))) {
      return res.status(403).json({ success: false, message: 'Books order permission required' })
    }
    if (itemTypes.has('UNIFORM') && !(await currentPermissionValue(req.user, 'canCreateUniformOrders'))) {
      return res.status(403).json({ success: false, message: 'Uniform order permission required' })
    }
    next()
  } catch (err) {
    next(err)
  }
}

const itemSchema = z.object({
  itemType: z.enum(['BOOK', 'UNIFORM', 'ACCESSORY']),
  itemId: z.string().min(1),
  label: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
})

const createSchema = {
  body: z.object({
    studentId: z.string().min(1, 'studentId is required'),
    branchId: z.string().min(1, 'branchId is required'),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    discountAmount: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
}

const paymentSchema = {
  body: z.object({
    amount: z.number().min(0, 'amount cannot be negative'),
    paymentMethod: z.enum([
      'CASH', 'ONLINE', 'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
      'CARD', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'PHONEPE', 'PAYTM', 'CREDIT', 'OTHER',
    ]),
    referenceId: z.string().optional(),
    notes: z.string().optional(),
  }),
}

const updateSchema = {
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED']).optional(),
    bookStatus: z.enum(['TAKEN', 'PARTIAL', 'NOT_TAKEN']).optional(),
    uniformStatus: z.enum(['COMPLETE', 'PARTIAL', 'PENDING']).optional(),
    notes: z.string().optional(),
  }),
}

router.get('/', requireAnyPermission('canPlaceOrders', 'canViewStudentPurchaseDetails'), enforceBranchScope, ctrl.list)
router.post('/', requireAnyPermission('canPlaceOrders', 'canCreateUniformOrders'), enforceBranchScope, validate(createSchema), requireOrderItemPermissions, ctrl.create)
router.get('/:id', requireAnyPermission('canPlaceOrders', 'canViewStudentPurchaseDetails'), enforceBranchScope, ctrl.getOne)
router.patch('/:id', requirePermission('canPlaceOrders'), enforceBranchScope, validate(updateSchema), ctrl.update)
router.post('/:id/payment', requireAnyPermission('canPlaceOrders', 'canCreateUniformOrders'), enforceBranchScope, validate(paymentSchema), ctrl.processPayment)
router.delete('/:id', requirePermission('canPlaceOrders'), enforceBranchScope, ctrl.cancel)

module.exports = router
