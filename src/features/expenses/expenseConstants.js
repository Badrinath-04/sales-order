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
  { value: 'STATIONERY',     label: 'Stationery' },
  { value: 'MAINTENANCE',    label: 'Maintenance' },
  { value: 'FOOD',           label: 'Food' },
  { value: 'TRANSPORT',      label: 'Transport' },
  { value: 'MISCELLANEOUS',  label: 'Miscellaneous' },
  { value: 'VENDOR_PAYMENT', label: 'Vendor Payment' },
  { value: 'OTHER',          label: 'Other' },
]

export const EXPENSE_CATEGORY_LABELS = {
  STATIONERY:     'Stationery',
  MAINTENANCE:    'Maintenance',
  FOOD:           'Food',
  TRANSPORT:      'Transport',
  MISCELLANEOUS:  'Miscellaneous',
  VENDOR_PAYMENT: 'Vendor Payment',
  OTHER:          'Other',
}

export const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Cash' },
  { value: 'GPAY',          label: 'Google Pay' },
  { value: 'PHONEPE',       label: 'PhonePe' },
  { value: 'PAYTM',         label: 'Paytm' },
  { value: 'CANARA_UPI',    label: 'Canara UPI' },
  { value: 'BOB_UPI',       label: 'BOB UPI' },
  { value: 'UPI_BHARATH',   label: 'UPI – Bharath' },
  { value: 'UPI_POORNIMA',  label: 'UPI – Poornima' },
  { value: 'UPI_RAJANI',    label: 'UPI To Rajani' },
  { value: 'UPI_VARALAXMI', label: 'UPI To Varalaxmi' },
  { value: 'UPI_INDU',      label: 'UPI To Indu' },
  { value: 'UPI_BHARATHI',  label: 'UPI To Bharathi' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD',          label: 'Card' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'ONLINE',        label: 'Online Transfer' },
  { value: 'CREDIT',        label: 'Credit' },
  { value: 'OTHER',         label: 'Other' },
]

/** Default Online Allocation methods per branch when no custom config is saved. */
export const BRANCH_DEFAULT_ONLINE_ALLOCATION_METHODS = {
  shaikpet: ['OTHER', 'UPI_RAJANI'],
  narsingi: ['OTHER', 'UPI_VARALAXMI', 'UPI_INDU', 'UPI_POORNIMA'],
  darga: ['OTHER', 'UPI_BHARATHI', 'BOB_UPI'],
}

export function defaultOnlineAllocationMethodsForBranch(branchName) {
  const normalized = String(branchName ?? '').trim().toLowerCase()
  for (const [token, methods] of Object.entries(BRANCH_DEFAULT_ONLINE_ALLOCATION_METHODS)) {
    if (normalized.includes(token)) return methods
  }
  return []
}

/** Empty stored list + unrestricted branch → all online methods (handled in drawer). */
export function resolveOnlineAllocationPaymentMethods(branchName, storedMethods) {
  if (Array.isArray(storedMethods) && storedMethods.length > 0) return storedMethods
  return defaultOnlineAllocationMethodsForBranch(branchName)
}

export const PAYMENT_METHOD_LABELS = {
  CASH:          'Cash',
  GPAY:          'Google Pay',
  PHONEPE:       'PhonePe',
  PAYTM:         'Paytm',
  CANARA_UPI:    'Canara UPI',
  BOB_UPI:       'BOB UPI',
  UPI_BHARATH:   'UPI – Bharath',
  UPI_POORNIMA:  'UPI – Poornima',
  UPI_RAJANI:    'UPI To Rajani',
  UPI_VARALAXMI: 'UPI To Varalaxmi',
  UPI_INDU:      'UPI To Indu',
  UPI_BHARATHI:  'UPI To Bharathi',
  BANK_TRANSFER: 'Bank Transfer',
  CARD:          'Card',
  CHEQUE:        'Cheque',
  ONLINE:        'Online Transfer',
  CREDIT:        'Credit',
  OTHER:         'Other',
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
