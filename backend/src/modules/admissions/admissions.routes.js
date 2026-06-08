const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./admissions.controller')
const { authenticate, enforceBranchScope, requirePermission, requireAnyPermission } = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

const splitEntrySchema = z.object({
  method: z.enum(['CASH', 'ONLINE', 'CANARA_UPI', 'UPI', 'CARD']),
  amount: z.number().positive(),
})

const createSchema = {
  body: z.object({
    studentName: z.string().min(1, 'Student name is required'),
    parentName: z.string().optional(),
    phone: z.string().min(1, 'Phone number is required'),
    grade: z.number().int(),
    section: z.string().min(1, 'Section is required'),
    classLabel: z.string().min(1),
    branchId: z.string().min(1, 'branchId is required'),
    amount: z.number().positive('Amount must be greater than zero'),
    remarks: z.string().optional(),
  }),
}

const updateSchema = {
  body: z.object({
    studentName: z.string().min(1).optional(),
    parentName: z.string().optional(),
    phone: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    remarks: z.string().optional(),
  }),
}

const paymentSchema = {
  body: z.object({
    paymentMethod: z.enum(['CASH', 'ONLINE', 'CANARA_UPI', 'UPI', 'CARD', 'SPLIT']),
    amount: z.number().positive('amount must be greater than zero'),
    splitDetails: z.array(splitEntrySchema).optional(),
    remarks: z.string().optional(),
  }),
}

const settingsSchema = {
  body: z.object({
    defaultAmount: z.number().positive('Default amount must be greater than zero'),
    branchId: z.string().optional(),
  }),
}

router.get(
  '/transactions',
  requirePermission('canViewAdmissionTransactions'),
  enforceBranchScope,
  ctrl.listTransactions,
)
router.get('/settings', requireAnyPermission('canViewAdmissions', 'canManageAdmissions'), ctrl.getSettings)
router.put('/settings', requirePermission('canManageAdmissions'), validate(settingsSchema), ctrl.updateSettings)

router.get('/', requireAnyPermission('canViewAdmissions', 'canManageAdmissions'), enforceBranchScope, ctrl.list)
router.post('/', requirePermission('canManageAdmissions'), enforceBranchScope, validate(createSchema), ctrl.create)
router.get('/:id', requireAnyPermission('canViewAdmissions', 'canManageAdmissions'), ctrl.getOne)
router.patch('/:id', requirePermission('canManageAdmissions'), validate(updateSchema), ctrl.update)
router.post('/:id/payment', requirePermission('canManageAdmissions'), validate(paymentSchema), ctrl.processPayment)

module.exports = router
