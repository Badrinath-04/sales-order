/** Payment methods that count toward "Cash Received" KPIs. */
const CASH_METHOD = 'CASH'

/** Credit sales are tracked separately until cleared via a real payment method. */
const CREDIT_METHOD = 'CREDIT'

function isCashPaymentMethod(method) {
  return method === CASH_METHOD
}

/** All non-cash, non-credit methods (UPI, card, bank transfer, ONLINE, etc.). */
function isOnlinePaymentMethod(method) {
  if (!method) return false
  return method !== CASH_METHOD && method !== CREDIT_METHOD
}

/**
 * Sum transaction amounts into cash / online buckets from groupBy rows or list items.
 * @param {Array<{ paymentMethod?: string, _sum?: { amount?: unknown }, amount?: unknown }>} rows
 */
function sumPaymentBuckets(rows) {
  let cashReceived = 0
  let onlineReceived = 0

  for (const row of rows) {
    const method = row.paymentMethod
    const amount = Number(row._sum?.amount ?? row.amount ?? 0)
    if (!amount) continue
    if (isCashPaymentMethod(method)) cashReceived += amount
    else if (isOnlinePaymentMethod(method)) onlineReceived += amount
  }

  return { cashReceived, onlineReceived }
}

module.exports = {
  CASH_METHOD,
  CREDIT_METHOD,
  isCashPaymentMethod,
  isOnlinePaymentMethod,
  sumPaymentBuckets,
}
