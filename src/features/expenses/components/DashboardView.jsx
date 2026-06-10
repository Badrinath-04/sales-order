import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { useAnyPermission } from '@/hooks/usePermission'
import { expenseApi } from '../expenseApi'
import DailyCashCard from './DailyCashCard'
import CreateEntryDrawer from './CreateEntryDrawer'

export default function DashboardView() {
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const canRecord = useAnyPermission(['canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'])

  const fetchDashboard = useCallback(
    () => expenseApi.getDashboard(isSuperAdmin && !branchId ? undefined : { branchId }),
    [branchId, isSuperAdmin],
  )
  const fetchRecipients = useCallback(
    () => expenseApi.getRecipients(branchId ? { branchId } : undefined),
    [branchId],
  )

  const { data: dashData, loading: dashLoading, refetch } = useApi(fetchDashboard, null, [branchId])
  const { data: recipients } = useApi(fetchRecipients, null, [branchId])

  const summaries = Array.isArray(dashData) ? dashData : dashData ? [dashData] : []

  function handleCreated() {
    refetch()
    setDrawerOpen(false)
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-headline text-lg font-bold text-on-surface">Daily Cash Position</h2>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {canRecord && (
          <button
            onClick={() => setDrawerOpen(true)}
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
          {summaries.map((summary) => (
            <DailyCashCard
              key={summary.branch?.id}
              summary={summary}
              loading={false}
              onRecordEntry={canRecord ? () => setDrawerOpen(true) : undefined}
            />
          ))}
        </div>
      )}

      {/* Entry drawer */}
      {drawerOpen && (
        <CreateEntryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          branchId={branchId}
          recipients={Array.isArray(recipients) ? recipients : []}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
