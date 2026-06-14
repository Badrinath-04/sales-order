'use strict'

/**
 * Allocates a split payment sequentially across orders.
 * Fills the first payment method completely before starting the second.
 *
 * @param {Array<{id: string, branchId: string, total: number}>} orders
 * @param {Array<{paymentMethod: string, amount: number}>} splitDetails
 * @returns {Array<{orderId: string, branchId: string, paymentMethod: string, amount: number}>}
 */
function allocatePayment(orders, splitDetails) {
  const allocations = []
  let methodIdx = 0
  let methodRemaining = Number(splitDetails[0]?.amount ?? 0)

  for (const order of orders) {
    let orderRemaining = order.total

    while (orderRemaining > 0.005 && methodIdx < splitDetails.length) {
      const take = Math.min(orderRemaining, methodRemaining)
      if (take > 0.005) {
        allocations.push({
          orderId: order.id,
          branchId: order.branchId,
          paymentMethod: splitDetails[methodIdx].paymentMethod,
          amount: Math.round(take * 100) / 100,
        })
      }
      orderRemaining -= take
      methodRemaining -= take

      if (methodRemaining < 0.005 && methodIdx < splitDetails.length - 1) {
        methodIdx++
        methodRemaining = Number(splitDetails[methodIdx].amount ?? 0)
      }
    }
  }

  return allocations
}

module.exports = { allocatePayment }
