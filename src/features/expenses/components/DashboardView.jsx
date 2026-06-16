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

export default function DashboardView({ branchId: propBranchId, branches: propBranches }) {
  const { branchId: sessionBranchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerBranchId, setDrawerBranchId] = useState(null)
  // Internal branch selector only used when parent doesn't provide one
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const canRecord = useAnyPermission(['canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'])

  // If parent provides branchId (module-level selector), use it; otherwise use internal selection
  let activeBranchId = sessionBranchId
  if (isSuperAdmin) {
    activeBranchId = propBranchId !== undefined ? propBranchId : selectedBranchId
  }

  function openDrawer(branchId) {
    setDrawerBranchId(branchId || activeBranchId || null)
    setDrawerOpen(true)
  }

  const usesExternalBranch = propBranchId !== undefined

  // All active branches for internal super admin dropdown (only when parent doesn't supply)
  const fetchBranches = useCallback(
    () => (isSuperAdmin && !usesExternalBranch) ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin, usesExternalBranch],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin, usesExternalBranch])
  const branches = propBranches ?? (Array.isArray(branchesData) ? branchesData : [])

  // Dashboard cards — respects activeBranchId
  const fetchDashboard = useCallback(
    () => activeBranchId
      ? expenseApi.getDashboard({ branchId: activeBranchId })
      : isSuperAdmin
        ? expenseApi.getDashboard()  // all branches
        : null,
    [activeBranchId, isSuperAdmin],
  )

  // All-time KPI summary — respects activeBranchId
  const fetchSummary = useCallback(
    () => expenseApi.getSummary({
      period: 'all',
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
    setDrawerBranchId(null)
  }

  const kpis = [
    { icon: 'payments',      label: 'Cash Collected (total)',       value: formatCurrency(summary?.totalCashCollected ?? 0),      color: 'text-primary' },
    { icon: 'account_balance', label: 'Online Collected (total)',   value: formatCurrency(summary?.totalOnlineCollected ?? 0),    color: 'text-blue-600' },
    { icon: 'arrow_upward',  label: 'Handovers (total)',            value: formatCurrency(summary?.totalHandovers ?? 0),          color: 'text-orange-600' },
    { icon: 'receipt_long',  label: 'Expenses (total)',             value: formatCurrency(summary?.totalExpenses ?? 0),           color: 'text-error' },
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
          {/* Branch selector — super admin only, hidden when parent controls selection */}
          {isSuperAdmin && !usesExternalBranch && branches.length > 0 && (
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
              onClick={() => openDrawer(activeBranchId)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary font-body hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Record Entry
            </button>
          )}
        </div>
      </div>

      {/* Branch prompt for super admin with no selection */}
      {isSuperAdmin && !activeBranchId && summaries.length === 0 && !dashLoading && (
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
              onRecordEntry={canRecord ? () => openDrawer(s.branch?.id) : undefined}
            />
          ))}
        </div>
      ) : null}

      {/* Entry drawer */}
      {drawerOpen && (
        <CreateEntryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          branchId={drawerBranchId || activeBranchId || null}
          branches={branches}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
