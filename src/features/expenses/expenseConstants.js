export const ENTRY_TYPES = {
  HANDOVER: 'HANDOVER',
  EXPENSE: 'EXPENSE',
  ONLINE_ALLOCATION: 'ONLINE_ALLOCATION',
}

export const ENTRY_TYPE_LABELS = {
  HANDOVER: 'Cash Handover',
  EXPENSE: 'Operational Expense',
  ONLINE_ALLOCATION: 'Online Allocation',
}

export const ENTRY_TYPE_COLORS = {
  HANDOVER: 'text-blue-600 bg-blue-50',
  EXPENSE: 'text-red-600 bg-red-50',
  ONLINE_ALLOCATION: 'text-purple-600 bg-purple-50',
}

export const EXPENSE_CATEGORIES = [
  { value: 'STATIONERY',    label: 'Stationery' },
  { value: 'MAINTENANCE',   label: 'Maintenance' },
  { value: 'FOOD',          label: 'Food' },
  { value: 'TRANSPORT',     label: 'Transport' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
]

export const EXPENSE_CATEGORY_LABELS = {
  STATIONERY:    'Stationery',
  MAINTENANCE:   'Maintenance',
  FOOD:          'Food',
  TRANSPORT:     'Transport',
  MISCELLANEOUS: 'Miscellaneous',
}

export const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Cash' },
  { value: 'UPI',           label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
]

export const PAYMENT_METHOD_LABELS = {
  CASH:          'Cash',
  UPI:           'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CARD:          'Card',
}

export function formatCurrency(amount) {
  const num = Number(amount ?? 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

export function formatEntryDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatEntryTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
