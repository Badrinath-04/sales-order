import { useCallback } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

function formatMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function KPISection() {
  const { branchId } = useAdminSession()

  const fetchDashboard = useCallback(
    () => reportsApi.adminDashboard({ branchId }),
    [branchId],
  )
  const { data, loading } = useApi(fetchDashboard, null, [branchId])

  const kpis = data?.kpis ?? {}
  const revenueToday = kpis.revenueToday ?? 0
  const ordersToday = kpis.ordersToday ?? 0
  const pendingRevenue = kpis.pendingRevenue ?? 0

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
            {loading ? '—' : formatMoney(revenueToday)}
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
            {loading ? '—' : ordersToday}
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
          {pendingRevenue > 0 && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" aria-hidden />}
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-on-surface-variant md:text-sm">Pending Revenue</span>
          <h4 className="font-headline text-2xl font-extrabold text-on-surface md:text-5xl">
            {loading ? '—' : formatMoney(pendingRevenue)}
          </h4>
        </div>
      </div>
    </div>
  )
}
