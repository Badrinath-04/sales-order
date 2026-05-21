import { toYmd } from '@/features/super-admin/sales-overview/dateRangePresets'

/** Local calendar "today" as YYYY-MM-DD for dashboard KPI API params (matches server parseDayStart). */
export function getLocalTodayRangeParams() {
  const y = toYmd(new Date())
  return { dateFrom: y, dateTo: y }
}
