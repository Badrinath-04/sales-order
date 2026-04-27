import { useCallback } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

function formatCurrency(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
  const pendingPayments = kpis.pendingPayments ?? 0

  return (
    <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <span className="material-symbols-outlined" data-icon="payments" aria-hidden>
              payments
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Today</span>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Today&apos;s Sales</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">
            {loading ? '—' : formatCurrency(revenueToday)}
          </h4>
        </div>
      </div>

      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-secondary-container/30 p-3 text-secondary">
            <span className="material-symbols-outlined" data-icon="task_alt" aria-hidden>
              task_alt
            </span>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
            On Track
          </span>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Orders Today</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">
            {loading ? '—' : ordersToday}
          </h4>
        </div>
      </div>

      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-tertiary/10 p-3 text-tertiary">
            <span className="material-symbols-outlined" data-icon="pending_actions" aria-hidden>
              pending_actions
            </span>
          </div>
          {pendingPayments > 0 && <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" aria-hidden />}
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Pending Payments</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">
            {loading ? '—' : pendingPayments}
          </h4>
        </div>
      </div>
    </div>
  )
}
