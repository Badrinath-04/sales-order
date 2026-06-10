import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { useAnyPermission } from '@/hooks/usePermission'
import { expenseApi } from '../expenseApi'
import { formatCurrency } from '../expenseConstants'
import DailyCashCard from './DailyCashCard'
import CreateEntryDrawer from './CreateEntryDrawer'

function KpiCard({ icon, label, value, color = 'text-primary', loading }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
        <div className="mb-3 h-8 w-8 rounded-lg bg-surface-container-high" />
        <div className="mb-2 h-3 w-24 rounded bg-surface-container-high" />
        <div className="h-6 w-28 rounded bg-surface-container-high" />
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
      <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      <p className="mt-2 text-xs font-label font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-xl font-bold text-on-surface">{value}</p>
    </div>
  )
}

export default function DashboardView() {
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerBranchId, setDrawerBranchId] = useState(null)
  const canRecord = useAnyPermission(['canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'])

  // Dashboard cards (today's per-branch summaries)
  const fetchDashboard = useCallback(
    () => expenseApi.getDashboard(isSuperAdmin && !branchId ? undefined : { branchId }),
    [branchId, isSuperAdmin],
  )

  // Monthly KPI summary
  const fetchSummary = useCallback(
    () => expenseApi.getSummary({
      period: 'month',
      ...(branchId ? { branchId } : {}),
    }),
    [branchId],
  )

  // Recipients for the active drawer branch
  const fetchRecipients = useCallback(
    () => expenseApi.getRecipients(drawerBranchId ? { branchId: drawerBranchId } : branchId ? { branchId } : undefined),
    [drawerBranchId, branchId],
  )

  const { data: dashData, loading: dashLoading, refetch } = useApi(fetchDashboard, null, [branchId])
  const { data: summary, loading: summaryLoading } = useApi(fetchSummary, null, [branchId])
  const { data: recipients } = useApi(fetchRecipients, null, [drawerBranchId, branchId])

  const summaries = Array.isArray(dashData) ? dashData : dashData ? [dashData] : []

  function openDrawerForBranch(bid) {
    setDrawerBranchId(bid)
    setDrawerOpen(true)
  }

  function handleCreated() {
    refetch()
    setDrawerOpen(false)
    setDrawerBranchId(null)
  }

  const kpis = [
    { icon: 'payments', label: 'Cash Collected (this month)', value: formatCurrency(summary?.totalCashCollected ?? 0), color: 'text-primary' },
    { icon: 'arrow_upward', label: 'Handovers (this month)', value: formatCurrency(summary?.totalHandovers ?? 0), color: 'text-blue-600' },
    { icon: 'receipt_long', label: 'Expenses (this month)', value: formatCurrency(summary?.totalExpenses ?? 0), color: 'text-error' },
    { icon: 'phone_android', label: 'Online Allocations (this month)', value: formatCurrency(summary?.totalOnlineAllocations ?? 0), color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} loading={summaryLoading} {...k} />
        ))}
      </div>

      {/* Daily position header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-base font-bold text-on-surface">Today's Cash Position</h2>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Top-level button only for single-branch users */}
        {canRecord && !isSuperAdmin && (
          <button
            onClick={() => openDrawerForBranch(branchId)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary font-body hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Record Entry
          </button>
        )}
      </div>

      {/* Cards grid */}
      {dashLoading ? (
        <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 max-w-md'}`}>
          {(isSuperAdmin ? [1, 2, 3] : [1]).map((i) => (
            <DailyCashCard key={i} loading />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">account_balance_wallet</span>
          <p className="mt-2 font-body text-sm text-on-surface-variant">No branch data available</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${summaries.length > 1 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-md'}`}>
          {summaries.map((s) => (
            <DailyCashCard
              key={s.branch?.id}
              summary={s}
              loading={false}
              onRecordEntry={canRecord ? () => openDrawerForBranch(s.branch?.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Entry drawer */}
      {drawerOpen && (
        <CreateEntryDrawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setDrawerBranchId(null) }}
          branchId={drawerBranchId || branchId}
          recipients={Array.isArray(recipients) ? recipients : []}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
