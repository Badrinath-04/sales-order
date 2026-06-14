'use strict'
const { allocatePayment } = require('../../../utils/paymentAllocation')

const orders2 = [
  { id: 'ord-1', branchId: 'branch-1', total: 1500 },
  { id: 'ord-2', branchId: 'branch-1', total: 2000 },
]

describe('allocatePayment', () => {
  test('single method — allocates full amount per order', () => {
    const result = allocatePayment(orders2, [{ paymentMethod: 'CASH', amount: 3500 }])
    expect(result).toEqual([
      { orderId: 'ord-1', branchId: 'branch-1', paymentMethod: 'CASH', amount: 1500 },
      { orderId: 'ord-2', branchId: 'branch-1', paymentMethod: 'CASH', amount: 2000 },
    ])
  })

  test('split — fills first method before switching', () => {
    const result = allocatePayment(orders2, [
      { paymentMethod: 'CASH', amount: 2000 },
      { paymentMethod: 'ONLINE', amount: 1500 },
    ])
    expect(result).toEqual([
      { orderId: 'ord-1', branchId: 'branch-1', paymentMethod: 'CASH', amount: 1500 },
      { orderId: 'ord-2', branchId: 'branch-1', paymentMethod: 'CASH', amount: 500 },
      { orderId: 'ord-2', branchId: 'branch-1', paymentMethod: 'ONLINE', amount: 1500 },
    ])
  })

  test('sum of allocations equals sum of order totals', () => {
    const orders3 = [
      { id: 'o1', branchId: 'b1', total: 1200 },
      { id: 'o2', branchId: 'b1', total: 1800 },
      { id: 'o3', branchId: 'b1', total: 2500 },
    ]
    const result = allocatePayment(orders3, [
      { paymentMethod: 'CASH', amount: 3000 },
      { paymentMethod: 'GPAY', amount: 2500 },
    ])
    const total = result.reduce((s, r) => s + r.amount, 0)
    expect(total).toBeCloseTo(5500, 1)
  })

  test('single order single method — one allocation entry', () => {
    const result = allocatePayment(
      [{ id: 'o1', branchId: 'b1', total: 1500 }],
      [{ paymentMethod: 'ONLINE', amount: 1500 }],
    )
    expect(result).toEqual([
      { orderId: 'o1', branchId: 'b1', paymentMethod: 'ONLINE', amount: 1500 },
    ])
  })
})
