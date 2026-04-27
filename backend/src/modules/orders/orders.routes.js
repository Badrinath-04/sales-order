const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./orders.controller')
const { authenticate, enforceBranchScope } = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

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
    notes: z.string().optional(),
  }),
}

const paymentSchema = {
  body: z.object({
    amount: z.number().positive('amount must be positive'),
    paymentMethod: z.enum(['CASH', 'ONLINE', 'CARD', 'CHEQUE', 'BANK_TRANSFER']),
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

router.get('/', enforceBranchScope, ctrl.list)
router.post('/', validate(createSchema), ctrl.create)
router.get('/:id', ctrl.getOne)
router.patch('/:id', validate(updateSchema), ctrl.update)
router.post('/:id/payment', validate(paymentSchema), ctrl.processPayment)
router.delete('/:id', ctrl.cancel)

module.exports = router
