import { useCallback, useEffect, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { useAnyPermission } from '@/hooks/usePermission'
import { ROLES } from '@/config/navigation'
import { branchesApi } from '@/services/api'
import { expenseApi } from '../expenseApi'
import { formatCurrency, resolveOnlineAllocationPaymentMethods } from '../expenseConstants'
import DailyCashCard from './DailyCashCard'
import CreateEntryDrawer from './CreateEntryDrawer'

const ONLINE_METHOD_OPTIONS = [
  { value: 'GPAY',          label: 'Google Pay' },
  { value: 'PHONEPE',       label: 'PhonePe' },
  { value: 'PAYTM',         label: 'Paytm' },
  { value: 'CANARA_UPI',    label: 'Canara UPI' },
  { value: 'BOB_UPI',       label: 'BOB UPI' },
  { value: 'UPI_BHARATH',   label: 'UPI – Bharath' },
  { value: 'UPI_POORNIMA',  label: 'UPI – Poornima' },
  { value: 'UPI_RAJANI',    label: 'UPI To Rajani' },
  { value: 'UPI_VARALAXMI', label: 'UPI To Varalaxmi' },
  { value: 'UPI_INDU',      label: 'UPI To Indu' },
  { value: 'UPI_BHARATHI',  label: 'UPI To Bharathi' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD',          label: 'Card' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'CREDIT',        label: 'Credit' },
  { value: 'OTHER',         label: 'Other' },
]


function BranchMethodsConfig({ branches }) {
  const [open, setOpen] = useState(false)
  const [configs, setConfigs] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [saveError, setSaveError] = useState({})

  useEffect(() => {
    branches.forEach(async (b) => {
      try {
        const data = await expenseApi.getBranchMethods({ branchId: b.id })
        setConfigs((c) => ({ ...c, [b.id]: data.paymentMethods ?? [] }))
      } catch { /* ignore */ }
    })
  }, [branches])

  function toggleMethod(branchId, methodValue, currentMethods) {
    const next = currentMethods.includes(methodValue)
      ? currentMethods.filter((v) => v !== methodValue)
      : [...currentMethods, methodValue]
    setConfigs((c) => ({ ...c, [branchId]: next }))
  }

  function saveLabel(branchId) {
    if (saving[branchId]) return 'Saving…'
    if (saved[branchId]) return 'Saved ✓'
    return 'Save'
  }

  async function save(branchId) {
    setSaving((s) => ({ ...s, [branchId]: true }))
    setSaveError((e) => ({ ...e, [branchId]: null }))
    try {
      await expenseApi.updateBranchMethods({ branchId, paymentMethods: configs[branchId] ?? [] })
      setSaved((s) => ({ ...s, [branchId]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [branchId]: false })), 2000)
    } catch {
      setSaveError((e) => ({ ...e, [branchId]: 'Failed to save. Please try again.' }))
    } finally {
      setSaving((s) => ({ ...s, [branchId]: false }))
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-on-surface-variant">tune</span>
          <span className="font-headline text-sm font-semibold text-on-surface">Branch Payment Method Settings</span>
        </div>
        <span className="material-symbols-outlined text-base text-on-surface-variant">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div className="border-t border-outline-variant/10 px-4 pb-4 pt-3 space-y-4">
          <p className="text-xs text-on-surface-variant font-body">
            Configure which online payment methods are available for Online Allocation per branch.
            Leave all unchecked to allow all online methods.
          </p>
          {branches.map((b) => {
            const branchMethods = configs[b.id] ?? []
            return (
              <div key={b.id} className="rounded-xl border border-outline-variant/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-label text-on-surface">{b.name}</span>
                  <button type="button" onClick={() => save(b.id)} disabled={saving[b.id]}
                    className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary font-label hover:bg-primary/20 disabled:opacity-50 transition-colors">
                    {saveLabel(b.id)}
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ONLINE_METHOD_OPTIONS.map((m) => (
                    <label key={m.value} className="flex items-center gap-1.5 text-xs font-body cursor-pointer text-on-surface-variant">
                      <input type="checkbox" checked={branchMethods.includes(m.value)}
                        onChange={() => toggleMethod(b.id, m.value, branchMethods)}
                        className="rounded" />
                      {m.label}
                    </label>
                  ))}
                </div>
                {saveError[b.id] && (
                  <p className="mt-1 text-xs text-error font-body">{saveError[b.id]}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


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
  const { branchId: sessionBranchId, role, user } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Internal branch selector only used when parent doesn't provide one
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const canRecord = useAnyPermission(['canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation'])

  // If parent provides branchId (module-level selector), use it; otherwise use internal selection
  const activeBranchId = isSuperAdmin
    ? (propBranchId !== undefined ? propBranchId : selectedBranchId)
    : sessionBranchId

  const usesExternalBranch = propBranchId !== undefined

  // All active branches for internal super admin dropdown (only when parent doesn't supply)
  const fetchBranches = useCallback(
    () => (isSuperAdmin && !usesExternalBranch) ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin, usesExternalBranch],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin, usesExternalBranch])
  const branches = propBranches ?? (Array.isArray(branchesData) ? branchesData : [])

  // Dashboard cards — respects activeBranchId
  const fetchDashboard = useCallback(() => {
    if (activeBranchId) return expenseApi.getDashboard({ branchId: activeBranchId })
    if (isSuperAdmin)   return expenseApi.getDashboard()   // all branches
    return null
  }, [activeBranchId, isSuperAdmin])

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

  // For branch admins: fetch their branch's configured payment methods so the drawer
  // can filter the Online Allocation dropdown.
  const fetchBranchMethods = useCallback(
    () => !isSuperAdmin && activeBranchId
      ? expenseApi.getBranchMethods({ branchId: activeBranchId })
      : null,
    [isSuperAdmin, activeBranchId],
  )
  const { data: branchMethodsData } = useApi(fetchBranchMethods, null, [isSuperAdmin, activeBranchId])

  // For super admins: fetch the selected branch's payment methods so the drawer
  // shows the correct online method options (BranchMethodsConfig keeps its own
  // private state that DashboardView cannot read).
  const [activeBranchMethods, setActiveBranchMethods] = useState([])
  useEffect(() => {
    if (!isSuperAdmin) return
    if (!activeBranchId) { setActiveBranchMethods([]); return }
    expenseApi.getBranchMethods({ branchId: activeBranchId })
      .then((data) => setActiveBranchMethods(data.paymentMethods ?? []))
      .catch(() => setActiveBranchMethods([]))
  }, [isSuperAdmin, activeBranchId])

  // branchPaymentMethods: array of method value strings for the active branch.
  // Empty array means "show all online methods" (handled inside CreateEntryDrawer).
  const activeBranchName = isSuperAdmin
    ? branches.find((b) => b.id === activeBranchId)?.name
    : user?.branch?.name
  const rawBranchPaymentMethods = isSuperAdmin
    ? activeBranchMethods
    : Array.isArray(branchMethodsData?.paymentMethods)
      ? branchMethodsData.paymentMethods
      : []
  const branchPaymentMethods = resolveOnlineAllocationPaymentMethods(
    activeBranchName,
    rawBranchPaymentMethods,
  )

  const summaries = Array.isArray(dashData) ? dashData : dashData ? [dashData] : []

  function handleCreated() {
    refetch()
    setDrawerOpen(false)
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
          branchPaymentMethods={branchPaymentMethods}
        />
      )}

      {/* Branch payment method settings — super admin only */}
      {isSuperAdmin && branches.length > 0 && (
        <BranchMethodsConfig branches={branches} />
      )}
    </div>
  )
}
