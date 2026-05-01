import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '@/components/ui/KPICard'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { useShellPaths } from '@/hooks/useShellPaths'
import { metrics as demoMetrics } from '@/features/super-admin/sales-overview/data'
import { getSalesReportRange, toYmd } from '@/features/super-admin/sales-overview/dateRangePresets'
import BranchPerformanceGrid from '@/features/super-admin/sales-overview/components/BranchPerformanceGrid'
import InsightsCard from '@/features/super-admin/sales-overview/components/InsightsCard'
import SalesChart from '@/features/super-admin/sales-overview/components/SalesChart'
import SalesReportDateRange from '@/features/super-admin/sales-overview/components/SalesReportDateRange'
import SalesTable from '@/features/super-admin/sales-overview/components/SalesTable'
import {
  formatUsd,
  mapRecentOrdersToTableRows,
  mapSuperDashboardToMetrics,
  mapTrendToBars,
} from '@/features/super-admin/sales-overview/salesOverviewMappers'

/**
 * Branch-scoped reports dashboard — KPIs, branch performance (single campus), chart, insights, table.
 * Optional `branchIdOverride` for embedding when super admin previews one campus.
 * `embedded` — hide duplicate page header / FAB when rendered inside super-admin Reports view.
 */
export default function SalesOverview(props = {}) {
  const { branchIdOverride, embedded } = props
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { branchId: sessionBranchId } = useAdminSession()
  const branchId = branchIdOverride ?? sessionBranchId

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

  const queryParams = useMemo(() => {
    if (!branchId) return null
    return {
      branchId,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    }
  }, [branchId, range.dateFrom, range.dateTo])

  const rangeDepsKey = queryParams ? `${queryParams.dateFrom}|${queryParams.dateTo}|${queryParams.branchId}` : 'none'

  const fetchDashboard = useCallback((params) => {
    if (!params?.branchId) return Promise.resolve({ data: { data: {} } })
    return reportsApi.adminDashboard(params)
  }, [])
  const { data: dashData, loading: dashLoading } = useApi(fetchDashboard, queryParams, [rangeDepsKey])

  const fetchPerf = useCallback((params) => {
    if (!params?.branchId) return Promise.resolve({ data: { data: [] } })
    return reportsApi.branchPerformance(params)
  }, [])
  const { data: perfData, loading: perfLoading, error: perfError } = useApi(fetchPerf, queryParams, [rangeDepsKey])

  const fetchTrend = useCallback((params) => {
    if (!params?.branchId) return Promise.resolve({ data: { data: [] } })
    return reportsApi.salesTrend(params)
  }, [])
  const { data: trendData } = useApi(fetchTrend, queryParams, [rangeDepsKey])

  const kpis = dashData?.kpis
  const recentOrders = dashData?.recentOrders

  const metrics = useMemo(() => {
    if (kpis != null && !dashLoading) return mapSuperDashboardToMetrics(kpis, { periodLabel: range.label }) ?? demoMetrics
    return demoMetrics
  }, [kpis, dashLoading, range.label])

  const chartBars = useMemo(() => {
    const trend = Array.isArray(trendData) ? trendData : trendData?.data
    if (!Array.isArray(trend) || trend.length === 0) return null
    return mapTrendToBars(trend)
  }, [trendData])

  const branchCards = useMemo(() => {
    const perf = Array.isArray(perfData) ? perfData : perfData?.data
    if (!Array.isArray(perf) || !branchId) return []
    return perf.filter((b) => b.id === branchId)
  }, [perfData, branchId])

  const insightItems = useMemo(() => {
    if (!kpis) return null
    return [
      {
        id: 'rev',
        icon: 'payments',
        iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white',
        title: `Revenue (${range.label})`,
        body: formatUsd(kpis.revenueToday),
      },
      {
        id: 'pend',
        icon: 'account_balance_wallet',
        iconClassName: 'material-symbols-outlined shrink-0 text-xl text-amber-200',
        title: 'Pending revenue',
        body: formatUsd(kpis.pendingRevenue ?? 0),
      },
      {
        id: 'ord',
        icon: 'shopping_cart',
        iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white/90',
        title: `Orders (${range.label})`,
        body: `${kpis.ordersToday ?? 0} in this period`,
      },
    ]
  }, [kpis, range.label])

  const tableRows = useMemo(() => mapRecentOrdersToTableRows(recentOrders), [recentOrders])

  const onCustomChange = useCallback((field, value) => {
    if (field === 'customFrom') setCustomFrom(value)
    else setCustomTo(value)
  }, [])

  return (
    <>
      {!embedded ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Reports</h2>
            <p className="font-medium text-on-surface-variant">Monitor revenue and order activity for your campus.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(paths.ordersNew)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden>
              add_shopping_cart
            </span>
            New Order
          </button>
        </div>
      ) : null}

      {branchId ? (
        <SalesReportDateRange
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomChange={onCustomChange}
        />
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <KPICard key={m.id} metric={m} />
        ))}
      </div>

      <BranchPerformanceGrid branches={branchCards} loading={perfLoading} error={perfError} />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <SalesChart apiBars={chartBars ?? undefined} />
        <div className="space-y-6">
          <InsightsCard items={insightItems ?? undefined} />
        </div>
      </div>

      <SalesTable rows={tableRows ?? undefined} />

      {!embedded ? (
        <button
          type="button"
          onClick={() => navigate(paths.ordersNew)}
          className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-all hover:scale-110 active:scale-95 md:z-50"
          aria-label="New order"
        >
          <span className="material-symbols-outlined text-2xl" aria-hidden>
            add
          </span>
        </button>
      ) : null}
    </>
  )
}
