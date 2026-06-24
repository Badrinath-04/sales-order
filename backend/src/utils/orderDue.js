const DISCOUNT_NOTE_RE = /Discount [Aa]pplied:\s*₹?([\d,]+(?:\.\d+)?)/g

function parseDiscountFromText(text) {
  if (!text) return 0
  let total = 0
  for (const match of String(text).matchAll(DISCOUNT_NOTE_RE)) {
    total += Number(String(match[1]).replace(/,/g, ''))
  }
  return total
}

function sumOrderDiscount(order) {
  let discount = parseDiscountFromText(order.notes)
  for (const tx of order.transactions ?? []) {
    discount += parseDiscountFromText(tx.notes)
  }
  return discount
}

function computeOrderDue(order) {
  const totalAmount = Number(order.total ?? 0)
  const paidAmount = Number(order.paidAmount ?? 0)
  const discountAmount = sumOrderDiscount(order)
  const effectiveTotal = Math.max(0, totalAmount - discountAmount)
  const dueAmount = Math.max(0, effectiveTotal - paidAmount)
  return { totalAmount, paidAmount, discountAmount, effectiveTotal, dueAmount }
}

function isOrderFullySettled(order) {
  return computeOrderDue(order).dueAmount <= 0.009
}

module.exports = {
  computeOrderDue,
  isOrderFullySettled,
  sumOrderDiscount,
  parseDiscountFromText,
}
