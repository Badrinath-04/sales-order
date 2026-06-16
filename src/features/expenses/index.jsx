import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { usePermission } from '@/hooks/usePermission'
import { ROLES } from '@/config/navigation'
import { branchesApi } from '@/services/api'
import DashboardView from './components/DashboardView'
import EntryHistory from './components/EntryHistory'
import ReconciliationView from './components/ReconciliationView'

export default function ExpensesModule() {
  const { role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const canViewReconciliation = usePermission('canViewReconciliation')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedBranchId, setSelectedBranchId] = useState('')

  // Load branches once at module level for super admin
  const fetchBranches = useCallback(
    () => isSuperAdmin ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = Array.isArray(branchesData) ? branchesData : []

  const tabs = [
    { id: 'dashboard',      label: 'Dashboard',      icon: 'account_balance_wallet' },
    { id: 'history',        label: 'History',         icon: 'history' },
    ...(canViewReconciliation
      ? [{ id: 'reconciliation', label: 'Reconciliation', icon: 'balance' }]
      : []),
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">Cash Management</h1>
          <p className="text-sm text-on-surface-variant font-body">Track handovers, expenses, and daily cash position</p>
        </div>

        {/* Module-level branch selector — super admin only */}
        {isSuperAdmin && branches.length > 0 && (
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm font-body focus:border-primary focus:outline-none min-w-[180px]"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-surface-container-low p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — all tabs receive the same branchId */}
      {activeTab === 'dashboard' && (
        <DashboardView branchId={isSuperAdmin ? selectedBranchId : undefined} branches={branches} />
      )}
      {activeTab === 'history' && (
        <EntryHistory branchId={isSuperAdmin ? selectedBranchId : undefined} />
      )}
      {activeTab === 'reconciliation' && canViewReconciliation && (
        <ReconciliationView branchId={isSuperAdmin ? selectedBranchId : undefined} />
      )}
    </div>
  )
}
