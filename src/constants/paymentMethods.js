/** Display labels for payment method codes (API enums and checkout option ids). */
export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  CASH: 'Cash',
  canara_upi: 'Canara Bank UPI',
  CANARA_UPI: 'Canara Bank UPI',
  bob_upi: 'BOB UPI',
  BOB_UPI: 'BOB UPI',
  upi_bharath: 'UPI to Bharath Kumar',
  UPI_BHARATH: 'UPI to Bharath Kumar',
  upi_poornima: 'UPI to Poornima',
  UPI_POORNIMA: 'UPI to Poornima',
  online: 'Online',
  ONLINE: 'Online',
  card: 'Card',
  CARD: 'Card',
  cheque: 'Cheque',
  CHEQUE: 'Cheque',
  bank: 'Bank Transfer',
  bank_transfer: 'Bank Transfer',
  BANK_TRANSFER: 'Bank Transfer',
  gpay: 'Google Pay',
  GPAY: 'Google Pay',
  phonepe: 'PhonePe',
  PHONEPE: 'PhonePe',
  paytm: 'Paytm',
  PAYTM: 'Paytm',
  credit: 'Credit',
  CREDIT: 'Credit',
  other: 'Other',
  OTHER: 'Other',
}

/** Maps checkout option ids to API / database PaymentMethod enum values. */
export const CHECKOUT_TO_API_PAYMENT_METHOD = {
  cash: 'CASH',
  canara_upi: 'CANARA_UPI',
  bob_upi: 'BOB_UPI',
  upi_bharath: 'UPI_BHARATH',
  upi_poornima: 'UPI_POORNIMA',
  card: 'CARD',
  cheque: 'CHEQUE',
  bank: 'BANK_TRANSFER',
  bank_transfer: 'BANK_TRANSFER',
  gpay: 'GPAY',
  phonepe: 'PHONEPE',
  paytm: 'PAYTM',
  credit: 'CREDIT',
  other: 'OTHER',
}

export function paymentMethodLabel(raw) {
  if (!raw) return '—'
  const key = String(raw)
  return PAYMENT_METHOD_LABELS[key] ?? PAYMENT_METHOD_LABELS[key.toUpperCase()] ?? key
}
