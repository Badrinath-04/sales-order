import { useCallback, useEffect, useMemo, useState } from 'react'
import KPICard from '@/components/ui/KPICard'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import KpiCardSkeleton from '@/components/ui/KpiCardSkeleton'
import ChartSkeleton from '@/components/ui/ChartSkeleton'
import { getSalesReportRange, toYmd } from '../dateRangePresets'
import {
  mapInsightsFromPerformance,
  mapRecentOrdersToTableRows,
  mapSuperDashboardToMetrics,
  mapTrendToBars,
} from '../salesOverviewMappers'
import BranchPerformanceGrid from './BranchPerformanceGrid'
import InsightsCard from './InsightsCard'
import SalesChart from './SalesChart'
import SalesReportDateRange from './SalesReportDateRange'
import SalesTable from './SalesTable'

export default function GlobalSalesView({ itemCategory } = {}) {
  const [preset, setPreset] = useState('last7')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (preset !== 'custom') return
    const y = toYmd(new Date())
    setCustomFrom((f) => f || y)
    setCustomTo((t) => t || y)
  }, [preset])

  const range = useMemo(() => getSalesReportRange(preset, { customFrom, customTo }), [preset, customFrom, customTo])

  const queryParams = useMemo(
    () => ({
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      ...(itemCategory ? { itemCategory } : {}),
    }),
    [range.dateFrom, range.dateTo, itemCategory],
  )

  const rangeDepsKey = `${range.dateFrom}|${range.dateTo}|${itemCategory ?? 'all'}`

  const fetchDash = useCallback((params) => reportsApi.superDashboard(params), [])
  const { data: dashData, loading: dashLoading } = useApi(fetchDash, queryParams, [rangeDepsKey])

  const fetchPerf = useCallback((params) => reportsApi.branchPerformance(params), [])
  const { data: perfData, loading: perfLoading, error: perfError } = useApi(fetchPerf, queryParams, [rangeDepsKey])

  const fetchTrend = useCallback((params) => reportsApi.salesTrend(params), [])
  const { data: trendData } = useApi(fetchTrend, queryParams, [rangeDepsKey])

  const kpis = dashData?.kpis
  const recentOrders = dashData?.recentOrders

  const metrics = useMemo(() => {
    if (kpis != null && !dashLoading) return mapSuperDashboardToMetrics(kpis, { periodLabel: range.label })
    return null
  }, [kpis, dashLoading, range.label])

  const chartBars = useMemo(() => {
    const trend = Array.isArray(trendData) ? trendData : trendData?.data
    if (!Array.isArray(trend) || trend.length === 0) return null
    return mapTrendToBars(trend)
  }, [trendData])

  const branchCards = useMemo(() => {
    const perf = Array.isArray(perfData) ? perfData : perfData?.data
    if (!Array.isArray(perf)) return []
    return perf
  }, [perfData])

  const insightItems = useMemo(() => {
    const perf = Array.isArray(perfData) ? perfData : perfData?.data
    if (perf === undefined) return undefined
    return mapInsightsFromPerformance(perf, kpis?.pendingRevenue)
  }, [perfData, kpis?.pendingRevenue])

  const tableRows = useMemo(() => {
    const mapped = mapRecentOrdersToTableRows(recentOrders)
    return mapped
  }, [recentOrders])

  const onCustomChange = useCallback((field, value) => {
    if (field === 'customFrom') setCustomFrom(value)
    else setCustomTo(value)
  }, [])

  return (
    <>
      <SalesReportDateRange
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={onCustomChange}
      />

      <div className="reports-kpi-grid mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-5">
        {dashLoading || metrics == null
          ? Array.from({ length: 5 }, (_, i) => <KpiCardSkeleton key={i} />)
          : metrics.map((m) => <KPICard key={m.id} metric={m} />)}
      </div>

      <BranchPerformanceGrid branches={branchCards} loading={perfLoading} error={perfError} />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {dashLoading && chartBars == null ? (
          <ChartSkeleton />
        ) : (
          <SalesChart apiBars={chartBars ?? undefined} />
        )}
        <div className="space-y-6">
          <InsightsCard items={insightItems ?? undefined} />
        </div>
      </div>

      <SalesTable rows={tableRows ?? undefined} />
    </>
  )
}
