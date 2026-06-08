import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { useShellPaths } from '@/hooks/useShellPaths'
import { useApi } from '@/hooks/useApi'
import { admissionsApi } from '@/services/api'
import { ROLES } from '@/config/navigation'
import AdmissionTransactionsTable from './components/AdmissionTransactionsTable'

const fieldClass =
  'rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary'

const METHOD_OPTIONS = [
  { value: '', label: 'All payment modes' },
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CANARA_UPI', label: 'Canara Bank' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'SPLIT', label: 'Split' },
]

const EMPTY_FILTERS = { search: '', paymentMethod: '', dateFrom: '', dateTo: '' }

export default function AdmissionTransactions() {
  const navigate = useNavigate()
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const showBranchSelect = isSuperAdmin || (!isSuperAdmin && !branchId)
  const paths = useShellPaths()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const queryParams = useMemo(() => {
    const params = { limit: 50 }
    if (!showBranchSelect && branchId) params.branchId = branchId
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    return params
  }, [showBranchSelect, branchId, debouncedSearch, filters.paymentMethod, filters.dateFrom, filters.dateTo])

  const fetchTransactions = useCallback(() => admissionsApi.listTransactions(queryParams), [queryParams])
  const { data: listData, loading } = useApi(fetchTransactions, null, [queryParams])
  const transactions = useMemo(() => listData?.transactions ?? [], [listData])

  const { totalCollected, cashCollected, onlineCollected } = useMemo(() => {
    let total = 0
    let cash = 0
    let online = 0
    for (const t of transactions) {
      const amount = Number(t.amount ?? 0)
      total += amount
      if (t.paymentMethod === 'CASH') cash += amount
      else online += amount
    }
    return { totalCollected: total, cashCollected: cash, onlineCollected: online }
  }, [transactions])

  function update(patch) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const kpis = [
    { label: 'Total (current view)', value: totalCollected, icon: 'payments' },
    { label: 'Cash', value: cashCollected, icon: 'payments' },
    { label: 'Online', value: onlineCollected, icon: 'language' },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div>
        <button
          type="button"
          onClick={() => navigate(paths.admissions)}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>arrow_back</span>
          Back to Admissions
        </button>
        <h1 className="text-2xl font-bold text-on-surface">Admission Transaction History</h1>
        <p className="text-sm text-on-surface-variant">
          Standalone payment ledger for the New Admissions module — separate from Books &amp; Uniform transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3"
          >
            <span className="material-symbols-outlined text-2xl text-primary">{k.icon}</span>
            <div>
              <p className="text-lg font-bold text-on-surface leading-tight">
                ₹{k.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-on-surface-variant">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
          <input
            className={`${fieldClass} w-full pl-9`}
            placeholder="Search by name, phone, or admission code…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>
        <select className={fieldClass} value={filters.paymentMethod} onChange={(e) => update({ paymentMethod: e.target.value })}>
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          className={fieldClass}
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
        />
        <span className="text-xs text-on-surface-variant">to</span>
        <input
          type="date"
          className={fieldClass}
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
        />
        {(filters.search || filters.paymentMethod || filters.dateFrom || filters.dateTo) && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <AdmissionTransactionsTable transactions={transactions} loading={loading} />
    </div>
  )
}
