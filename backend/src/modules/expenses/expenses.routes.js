'use strict'
const { Router } = require('express')
const { z } = require('zod')
const ctrl = require('./expenses.controller')
const {
  authenticate,
  enforceBranchScope,
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
} = require('../../middleware/auth')
const validate = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

const VALID_PAYMENT_METHODS = [
  'CASH', 'ONLINE', 'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
  'UPI_RAJANI', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_BHARATHI',
  'CARD', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'PHONEPE', 'PAYTM', 'CREDIT', 'OTHER',
]

const createEntrySchema = {
  body: z.object({
    branchId:      z.string().min(1, 'branchId is required'),
    entryType:     z.enum(['HANDOVER', 'EXPENSE', 'ONLINE_ALLOCATION']),
    amount:        z.number().positive('Amount must be greater than zero'),
    paymentMethod: z.enum(VALID_PAYMENT_METHODS),
    recipient:     z.string().nullish(),
    publisherId:   z.string().nullish(),
    category:      z.enum(['STATIONERY', 'MAINTENANCE', 'FOOD', 'TRANSPORT', 'MISCELLANEOUS', 'VENDOR_PAYMENT', 'OTHER']).nullish(),
    description:   z.string().max(500).nullish(),
    referenceId:   z.string().max(200).nullish(),
    notes:         z.string().max(500).nullish(),
    entryDate:     z.string().nullish(),
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

router.get('/dashboard',      requirePermission('canViewExpenses'),      enforceBranchScope, ctrl.getDashboard)
router.get('/entries',        requirePermission('canViewExpenseHistory'), enforceBranchScope, ctrl.listEntries)
router.post(
  '/entries',
  requireAnyPermission('canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'),
  enforceBranchScope,
  validate(createEntrySchema),
  ctrl.createEntry,
)
router.patch(
  '/entries/:id/status',
  requirePermission('canViewExpenses'),
  validate({ body: z.object({ status: z.enum(['APPROVED', 'REJECTED']) }) }),
  ctrl.updateEntryStatus,
)
router.get('/daily',          requirePermission('canViewExpenses'),      enforceBranchScope, ctrl.getDailyPosition)
router.get('/reconciliation', requirePermission('canViewExpenses'),      enforceBranchScope, ctrl.getReconciliation)
router.get('/online-summary', requirePermission('canViewExpenses'),      enforceBranchScope, ctrl.getOnlineSummary)
router.get('/summary',        requirePermission('canViewExpenseHistory'), enforceBranchScope, ctrl.getSummary)
router.get('/settlements',    requirePermission('canViewExpenses'),      enforceBranchScope, ctrl.listSettlements)
router.post('/settlements',   requirePermission('canCreateHandoverEntry'), enforceBranchScope, validate({
  body: z.object({
    branchId:       z.string().min(1),
    paymentMethod:  z.enum(VALID_PAYMENT_METHODS),
    amountSettled:  z.number().positive(),
    settlementDate: z.string().nullish(),
    utrNumber:      z.string().max(100).nullish(),
    notes:          z.string().max(500).nullish(),
  }),
}), ctrl.createSettlement)
router.get('/recipients',     requirePermission('canViewExpenses'),       enforceBranchScope, ctrl.getRecipients)
router.post('/recipients',    requirePermission('canManageRecipients'),    validate(createRecipientSchema), ctrl.createRecipient)
router.patch('/recipients/:id', requirePermission('canManageRecipients'), validate(updateRecipientSchema), ctrl.updateRecipient)
const VALID_ONLINE_METHODS = [
  'CANARA_UPI', 'BOB_UPI', 'UPI_BHARATH', 'UPI_POORNIMA',
  'UPI_RAJANI', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_BHARATHI',
  'BANK_TRANSFER', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER',
  'GPAY', 'PHONEPE', 'PAYTM', 'ONLINE',
]

router.get('/branch-methods',   requirePermission('canViewExpenses'),      ctrl.getBranchMethods)
router.patch('/branch-methods', requireSuperAdmin, validate({
  body: z.object({
    branchId:       z.string().min(1, 'branchId is required'),
    paymentMethods: z.array(z.enum(VALID_ONLINE_METHODS)),
  }),
}), ctrl.updateBranchMethods)

module.exports = router
