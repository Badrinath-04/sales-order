/** Date presets for transactions list + KPI filters (local calendar days). */

export const TRANSACTION_DATE_OPTS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
]

export function periodKpiLabels(dateKey) {
  const labels = {
    today: { revenue: 'Revenue · Today', orders: 'Payments · Today' },
    yesterday: { revenue: 'Revenue · Yesterday', orders: 'Payments · Yesterday' },
    '7d': { revenue: 'Revenue · Last 7 days', orders: 'Payments · Last 7 days' },
    '30d': { revenue: 'Revenue · Last 30 days', orders: 'Payments · Last 30 days' },
    '90d': { revenue: 'Revenue · Last 3 months', orders: 'Payments · Last 3 months' },
  }
  return labels[dateKey] ?? { revenue: 'Revenue', orders: 'Payments' }
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** @param {string} preset */
export function getTransactionDateRange(preset) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

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
