/** Local-calendar date strings (YYYY-MM-DD) for report API query params. */

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export const SALES_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last one month' },
  { id: 'custom', label: 'Custom' },
]

/**
 * @param {'today'|'yesterday'|'last7'|'last30'|'custom'} preset
 * @param {{ customFrom?: string, customTo?: string }} [custom] — YYYY-MM-DD when preset is custom
 * @returns {{ dateFrom: string, dateTo: string, label: string }}
 */
export function getSalesReportRange(preset, custom = {}) {
  const now = new Date()

  if (preset === 'custom') {
    const today = toYmd(now)
    const from = custom.customFrom || today
    const to = custom.customTo || from
    const [a, b] = from <= to ? [from, to] : [to, from]
    return {
      dateFrom: a,
      dateTo: b,
      label: 'Custom range',
    }
  }

  if (preset === 'today') {
    const d = startOfLocalDay(now)
    const y = toYmd(d)
    return { dateFrom: y, dateTo: y, label: 'Today' }
  }

  if (preset === 'yesterday') {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    const d = startOfLocalDay(yest)
    const y = toYmd(d)
    return { dateFrom: y, dateTo: y, label: 'Yesterday' }
  }

  if (preset === 'last7') {
    const end = endOfLocalDay(now)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return {
      dateFrom: toYmd(start),
      dateTo: toYmd(end),
      label: 'Last 7 days',
    }
  }

  if (preset === 'last30') {
    const end = endOfLocalDay(now)
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    return {
      dateFrom: toYmd(start),
      dateTo: toYmd(end),
      label: 'Last one month',
    }
  }

  const d = startOfLocalDay(now)
  const y = toYmd(d)
  return { dateFrom: y, dateTo: y, label: 'Today' }
}
