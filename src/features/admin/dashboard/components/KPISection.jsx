import { useCallback, useEffect, useMemo } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { getLocalTodayRangeParams } from '@/utils/localDateRange'

function formatMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function KPISection() {
  const { branchId, permissionsReady } = useAdminSession()
  const todayParams = useMemo(() => getLocalTodayRangeParams(), [])

  const fetchDashboard = useCallback(
    () => {
      if (!permissionsReady) return null
      return reportsApi.adminDashboard({ branchId, ...todayParams })
    },
    [branchId, permissionsReady, todayParams],
  )
  const { data, loading, error } = useApi(fetchDashboard, null, [branchId, permissionsReady])

  const kpis = data?.kpis
  useEffect(() => {
    if (import.meta.env.DEV && kpis) {
      console.debug('[KPISection] admin-dashboard kpis', kpis)
    }
  }, [kpis])
  const hasKpis = kpis != null
  const revenueToday = hasKpis ? Number(kpis.revenueToday ?? 0) : null
  const ordersToday = hasKpis ? Number(kpis.ordersToday ?? 0) : null
  const pendingRevenue = hasKpis ? Number(kpis.pendingRevenue ?? 0) : null

  const showDash = (value, formatter = String) => {
    if (loading || !permissionsReady) return '—'
    if (!hasKpis) return error ? '—' : '—'
    return formatter(value)
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:mb-12 md:grid-cols-3 md:gap-6">
      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm transition-all duration-300 hover:bg-surface-container-low md:p-8">
        <div className="mb-3 flex items-start justify-between md:mb-6">
          <div className="rounded-xl bg-primary/10 p-2 text-primary md:p-3">
            <span className="material-symbols-outlined text-lg md:text-2xl" data-icon="payments" aria-hidden>
              payments
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary md:text-xs">Today</span>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-on-surface-variant md:text-sm">Today&apos;s revenue</span>
          <h4 className="font-headline text-2xl font-extrabold text-on-surface md:text-5xl">
            {showDash(revenueToday, formatMoney)}
          </h4>
        </div>
      </div>

      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm transition-all duration-300 hover:bg-surface-container-low md:p-8">
        <div className="mb-3 flex items-start justify-between md:mb-6">
          <div className="rounded-xl bg-secondary-container/30 p-2 text-secondary md:p-3">
            <span className="material-symbols-outlined text-lg md:text-2xl" data-icon="task_alt" aria-hidden>
              task_alt
            </span>
          </div>
          <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container md:px-3 md:py-1">
            On Track
          </span>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-on-surface-variant md:text-sm">Orders Today</span>
          <h4 className="font-headline text-2xl font-extrabold text-on-surface md:text-5xl">
            {showDash(ordersToday)}
          </h4>
        </div>
      </div>

      <div className="col-span-2 group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm transition-all duration-300 hover:bg-surface-container-low md:col-span-1 md:p-8">
        <div className="mb-3 flex items-start justify-between md:mb-6">
          <div className="rounded-xl bg-tertiary/10 p-2 text-tertiary md:p-3">
            <span className="material-symbols-outlined text-lg md:text-2xl" data-icon="pending_actions" aria-hidden>
              pending_actions
            </span>
          </div>
          {hasKpis && pendingRevenue > 0 && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" aria-hidden />}
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-on-surface-variant md:text-sm">Pending Revenue</span>
          <h4 className="font-headline text-2xl font-extrabold text-on-surface md:text-5xl">
            {showDash(pendingRevenue, formatMoney)}
          </h4>
        </div>
      </div>
    </div>
  )
}
