'use strict'
const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./expenses.controller')
const {
  authenticate,
  enforceBranchScope,
  requirePermission,
  requireAnyPermission,
} = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

const VALID_PAYMENT_METHODS = [
  'CASH', 'ONLINE', 'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
  'CARD', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'PHONEPE', 'PAYTM', 'CREDIT', 'OTHER',
]

const createEntrySchema = {
  body: z.object({
    branchId:      z.string().min(1, 'branchId is required'),
    entryType:     z.enum(['HANDOVER', 'EXPENSE', 'ONLINE_ALLOCATION']),
    amount:        z.number().positive('Amount must be greater than zero'),
    paymentMethod: z.enum(VALID_PAYMENT_METHODS),
    recipient:     z.string().optional(),
    category:      z.enum(['STATIONERY', 'MAINTENANCE', 'FOOD', 'TRANSPORT', 'MISCELLANEOUS']).optional(),
    description:   z.string().max(500).optional(),
    referenceId:   z.string().max(200).optional(),
    notes:         z.string().max(500).optional(),
    entryDate:     z.string().optional(),
  }),
}

const createRecipientSchema = {
  body: z.object({
    name:      z.string().min(1, 'Name is required').max(100),
    branchId:  z.string().optional(),
    sortOrder: z.number().int().optional(),
  }),
}

const updateRecipientSchema = {
  body: z.object({
    name:      z.string().min(1).max(100).optional(),
    isActive:  z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
}

router.get('/dashboard',     requirePermission('canViewExpenses'),       enforceBranchScope, ctrl.getDashboard)
router.get('/entries',       requirePermission('canViewExpenseHistory'),  enforceBranchScope, ctrl.listEntries)
router.post(
  '/entries',
  requireAnyPermission('canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'),
  enforceBranchScope,
  validate(createEntrySchema),
  ctrl.createEntry,
)
router.get('/reconciliation', requirePermission('canViewReconciliation'), enforceBranchScope, ctrl.getReconciliation)
router.get('/summary',        requirePermission('canViewExpenseHistory'),  enforceBranchScope, ctrl.getSummary)
router.get('/recipients',     requirePermission('canViewExpenses'),        enforceBranchScope, ctrl.getRecipients)
router.post('/recipients',    requirePermission('canManageRecipients'),    validate(createRecipientSchema), ctrl.createRecipient)
router.patch('/recipients/:id', requirePermission('canManageRecipients'), validate(updateRecipientSchema), ctrl.updateRecipient)

module.exports = router
