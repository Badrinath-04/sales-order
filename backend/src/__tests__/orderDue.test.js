const {
  computeOrderDue,
  isOrderFullySettled,
  isPureCreditDueOrder,
  creditOrderMatchesDateRange,
  parseDiscountFromText,
} = require('../utils/orderDue')

describe('orderDue', () => {
  describe('computeOrderDue', () => {
    it('computes due from total minus paid', () => {
      const due = computeOrderDue({ total: 5000, paidAmount: 3000, notes: null, transactions: [] })
      expect(due.dueAmount).toBe(2000)
      expect(due.effectiveTotal).toBe(5000)
    })

    it('subtracts discount from order notes', () => {
      const due = computeOrderDue({
        total: 5000,
        paidAmount: 4880,
        notes: 'Discount Applied: ₹120.00',
        transactions: [],
      })
      expect(due.discountAmount).toBe(120)
      expect(due.effectiveTotal).toBe(4880)
      expect(due.dueAmount).toBe(0)
    })

    it('subtracts discount from transaction notes', () => {
      const due = computeOrderDue({
        total: 7905,
        paidAmount: 7900,
        notes: null,
        transactions: [{ notes: 'Discount applied: ₹5.00' }],
      })
      expect(due.dueAmount).toBe(0)
    })
  })

  describe('isPureCreditDueOrder', () => {
    it('true when CREDIT transaction and nothing paid', () => {
      expect(isPureCreditDueOrder({
        paidAmount: 0,
        paymentStatus: 'UNPAID',
        transactions: [{ paymentMethod: 'CREDIT', amount: 5000 }],
      })).toBe(true)
    })

    it('true for DRAFT with no transactions (books issued, checkout incomplete)', () => {
      expect(isPureCreditDueOrder({
        paidAmount: 0,
        paymentStatus: 'UNPAID',
        transactions: [],
      })).toBe(true)
    })

    it('false when partial cash collected', () => {
      expect(isPureCreditDueOrder({
        paidAmount: 3000,
        paymentStatus: 'PARTIAL',
        transactions: [
          { paymentMethod: 'CASH', amount: 3000 },
          { paymentMethod: 'CREDIT', amount: 2000 },
        ],
      })).toBe(false)
    })

    it('false when fully paid', () => {
      expect(isPureCreditDueOrder({
        paidAmount: 5000,
        paymentStatus: 'PAID',
        transactions: [{ paymentMethod: 'CASH', amount: 5000 }],
      })).toBe(false)
    })
  })

  describe('creditOrderMatchesDateRange', () => {
    const orderWithCredit = {
      createdAt: '2026-06-10T10:00:00.000Z',
      transactions: [{ paymentMethod: 'CREDIT', paidAt: '2026-06-19T10:00:00.000Z', createdAt: '2026-06-19T10:00:00.000Z' }],
    }

    it('matches when no date filter', () => {
      expect(creditOrderMatchesDateRange(orderWithCredit, null, null)).toBe(true)
    })

    it('matches credit txn date inside range', () => {
      expect(creditOrderMatchesDateRange(
        orderWithCredit,
        '2026-06-19T00:00:00.000Z',
        '2026-06-19T23:59:59.999Z',
      )).toBe(true)
    })

    it('excludes credit txn outside range', () => {
      expect(creditOrderMatchesDateRange(
        orderWithCredit,
        '2026-06-24T00:00:00.000Z',
        '2026-06-24T23:59:59.999Z',
      )).toBe(false)
    })

    it('uses order createdAt for draft orders without credit txn', () => {
      const draft = { createdAt: '2026-06-10T10:00:00.000Z', transactions: [] }
      expect(creditOrderMatchesDateRange(
        draft,
        '2026-06-10T00:00:00.000Z',
        '2026-06-10T23:59:59.999Z',
      )).toBe(true)
    })
  })

  describe('isOrderFullySettled', () => {
    it('true when due is zero after discount', () => {
      expect(isOrderFullySettled({
        total: 6320,
        paidAmount: 6200,
        notes: null,
        transactions: [{ notes: 'Discount applied: ₹120.00' }],
      })).toBe(true)
    })
  })

  describe('parseDiscountFromText', () => {
    it('parses both discount note formats', () => {
      expect(parseDiscountFromText('Discount applied: ₹120.00')).toBe(120)
      expect(parseDiscountFromText('Discount Applied: ₹5.00')).toBe(5)
    })
  })
})
