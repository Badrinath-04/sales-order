import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { useAnyPermission } from '@/hooks/usePermission'
import { ROLES } from '@/config/navigation'
import { branchesApi } from '@/services/api'
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
  const { branchId: sessionBranchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const [drawerOpen, setDrawerOpen] = useState(false)
  // For super admin: which branch is selected in the filter dropdown
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const canRecord = useAnyPermission(['canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'])

  // The effective branch for API calls:
  // - regular admin: always their session branch
  // - super admin: whatever they've selected in the dropdown (or '' = all)
  const activeBranchId = isSuperAdmin ? selectedBranchId : sessionBranchId

  // All active branches for super admin dropdown
  const fetchBranches = useCallback(
    () => isSuperAdmin ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = Array.isArray(branchesData) ? branchesData : []

  // Dashboard cards — respects activeBranchId
  const fetchDashboard = useCallback(
    () => activeBranchId
      ? expenseApi.getDashboard({ branchId: activeBranchId })
      : isSuperAdmin
        ? expenseApi.getDashboard()  // all branches
        : null,
    [activeBranchId, isSuperAdmin],
  )

  // Monthly KPI summary — respects activeBranchId
  const fetchSummary = useCallback(
    () => expenseApi.getSummary({
      period: 'month',
      ...(activeBranchId ? { branchId: activeBranchId } : {}),
    }),
    [activeBranchId],
  )

  const { data: dashData, loading: dashLoading, refetch } = useApi(fetchDashboard, null, [activeBranchId, isSuperAdmin])
  const { data: summary, loading: summaryLoading } = useApi(fetchSummary, null, [activeBranchId])

  const summaries = Array.isArray(dashData) ? dashData : dashData ? [dashData] : []

  function handleCreated() {
    refetch()
    setDrawerOpen(false)
  }

  const kpis = [
    { icon: 'payments',      label: 'Cash Collected (this month)',      value: formatCurrency(summary?.totalCashCollected ?? 0),      color: 'text-primary' },
    { icon: 'arrow_upward',  label: 'Handovers (this month)',            value: formatCurrency(summary?.totalHandovers ?? 0),           color: 'text-blue-600' },
    { icon: 'receipt_long',  label: 'Expenses (this month)',             value: formatCurrency(summary?.totalExpenses ?? 0),            color: 'text-error' },
    { icon: 'phone_android', label: 'Online Allocations (this month)',   value: formatCurrency(summary?.totalOnlineAllocations ?? 0),   color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} loading={summaryLoading} {...k} />
        ))}
      </div>

      {/* Today's Cash Position header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline text-base font-bold text-on-surface">Today's Cash Position</h2>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Branch selector — super admin only */}
          {isSuperAdmin && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm font-body focus:border-primary focus:outline-none min-w-[160px]"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {/* Record Entry button */}
          {canRecord && (isSuperAdmin ? activeBranchId : true) && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary font-body hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Record Entry
            </button>
          )}
        </div>
      </div>

      {/* Branch prompt for super admin with no selection */}
      {isSuperAdmin && !selectedBranchId && branches.length > 0 && summaries.length === 0 && !dashLoading && (
        <div className="rounded-2xl border border-outline-variant/30 border-dashed bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">corporate_fare</span>
          <p className="mt-2 font-body text-sm font-semibold text-on-surface">Select a branch above</p>
          <p className="text-xs text-on-surface-variant mt-1">Choose a branch to view its daily cash position and record entries</p>
        </div>
      )}

      {/* Cards grid */}
      {dashLoading ? (
        <div className="grid gap-4 grid-cols-1 max-w-md">
          <DailyCashCard loading />
        </div>
      ) : summaries.length > 0 ? (
        <div className={`grid gap-4 ${summaries.length > 1 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-md'}`}>
          {summaries.map((s) => (
            <DailyCashCard
              key={s.branch?.id}
              summary={s}
              loading={false}
              onRecordEntry={canRecord && !isSuperAdmin ? () => setDrawerOpen(true) : undefined}
            />
          ))}
        </div>
      ) : null}

      {/* Entry drawer */}
      {drawerOpen && (
        <CreateEntryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          branchId={activeBranchId || null}
          branches={branches}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
