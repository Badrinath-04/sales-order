/** Date presets for transactions list + KPI filters (local calendar days). */

export const TRANSACTION_DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Date' },
]

const PERIOD_SUFFIX = {
  today: 'TODAY',
  yesterday: 'YESTERDAY',
  '7d': 'LAST 7 DAYS',
  '30d': 'LAST 30 DAYS',
  '90d': 'LAST 3 MONTHS',
  custom: 'CUSTOM RANGE',
}

export function periodKpiLabels(dateKey) {
  const period = PERIOD_SUFFIX[dateKey]
  if (!period) {
    return {
      revenue: 'REVENUE',
      orders: 'PAYMENTS',
      cash: 'CASH RECEIVED',
      online: 'ONLINE RECEIVED',
    }
  }
  return {
    revenue: `REVENUE · ${period}`,
    orders: `PAYMENTS · ${period}`,
    cash: `CASH RECEIVED · ${period}`,
    online: `ONLINE RECEIVED · ${period}`,
  }
}

function formatReportDay(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDdMmForFilename(iso) {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}`
}

function sanitizeFilenamePart(value) {
  return (
    String(value ?? 'branch')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'branch'
  )
}

/**
 * Default save name for Print / Download PDF (browser uses document.title).
 * e.g. 12-05-18-05_Shaikpet_books-history
 */
export function buildTransactionHistoryPdfFilename({ datePreset, branchName }) {
  const range = getTransactionDateRange(datePreset)
  const branch = sanitizeFilenamePart(
    branchName === 'All Branches' ? 'All-Branches' : branchName,
  )

  let datePart = 'all-dates'
  if (range.dateFrom && range.dateTo) {
    const from = formatDdMmForFilename(range.dateFrom)
    const to = formatDdMmForFilename(range.dateTo)
    datePart = from === to ? from : `${from}-${to}`
  }

  return `${datePart}_${branch}_books-history`
}

/** Human-readable date range line for print/PDF header. */
export function formatReportDateRange(preset, custom = {}) {
  const label = TRANSACTION_DATE_OPTS.find((o) => o.value === preset)?.label ?? preset
  const range = getTransactionDateRange(preset, custom)
  if (!range.dateFrom || !range.dateTo) return label
  if (preset === 'custom' && custom.customDateFrom) {
    const from = formatReportDay(range.dateFrom)
    const to = formatReportDay(range.dateTo)
    return from === to ? `Custom — ${from}` : `Custom — ${from} to ${to}`
  }
  if (preset === 'today' || preset === 'yesterday') {
    return `${label} — ${formatReportDay(range.dateFrom)}`
  }
  return `${label} — ${formatReportDay(range.dateFrom)} to ${formatReportDay(range.dateTo)}`
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function parseYmdLocal(iso) {
  const s = String(iso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
  return new Date(y, m - 1, d)
}

/** @param {string} preset */
export function getTransactionDateRange(preset, custom = {}) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (preset === 'custom') {
    const fromRaw = custom.customDateFrom || custom.customFrom
    const toRaw = custom.customDateTo || custom.customTo || fromRaw
    const fromDate = parseYmdLocal(fromRaw)
    const toDate = parseYmdLocal(toRaw)
    if (!fromDate) return {}
    const endBase = toDate && toDate >= fromDate ? toDate : fromDate
    return {
      dateFrom: startOfDay(fromDate).toISOString(),
      dateTo: endOfDay(endBase).toISOString(),
    }
  }

  switch (preset) {
    case 'today':
      return { dateFrom: todayStart.toISOString(), dateTo: todayEnd.toISOString() }
    case 'yesterday': {
      const y = new Date(todayStart)
      y.setDate(y.getDate() - 1)
      return { dateFrom: y.toISOString(), dateTo: endOfDay(y).toISOString() }
    }
    case '7d': {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 6)
      return { dateFrom: from.toISOString(), dateTo: todayEnd.toISOString() }
    }
    case '30d': {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 29)
      return { dateFrom: from.toISOString(), dateTo: todayEnd.toISOString() }
    }
    case '90d': {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 89)
      return { dateFrom: from.toISOString(), dateTo: todayEnd.toISOString() }
    }
    default:
      return {}
  }
}
