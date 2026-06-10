import { useState } from 'react'
import { usePermission } from '@/hooks/usePermission'
import DashboardView from './components/DashboardView'
import EntryHistory from './components/EntryHistory'
import ReconciliationView from './components/ReconciliationView'

export default function ExpensesModule() {
  const canViewReconciliation = usePermission('canViewReconciliation')
  const [activeTab, setActiveTab] = useState('dashboard')

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
      <div>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">Cash Management</h1>
        <p className="text-sm text-on-surface-variant font-body">Track handovers, expenses, and daily cash position</p>
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

      {/* Tab content */}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'history' && <EntryHistory />}
      {activeTab === 'reconciliation' && canViewReconciliation && <ReconciliationView />}
    </div>
  )
}
