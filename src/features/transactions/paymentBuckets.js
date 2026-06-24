/** Mirrors backend paymentMethodBuckets — cash vs online (excludes credit). */

export function sumPaymentBucketsFromTransactions(transactions) {
  let cashReceived = 0
  let onlineReceived = 0
  let creditReceived = 0

  for (const tx of transactions) {
    const method = tx.paymentMethod
    const amount = Number(tx.amount ?? 0)
    if (!amount) continue
    if (method === 'CASH') cashReceived += amount
    else if (method === 'CREDIT') creditReceived += amount
    else if (method) onlineReceived += amount
  }

  return { cashReceived, onlineReceived, creditReceived }
}
