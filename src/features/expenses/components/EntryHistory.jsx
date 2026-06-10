import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { expenseApi } from '../expenseApi'
import {
  ENTRY_TYPE_LABELS, ENTRY_TYPE_COLORS, EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS, formatCurrency, formatEntryDate, formatEntryTime,
} from '../expenseConstants'

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'HANDOVER', label: 'Cash Handover' },
  { value: 'EXPENSE', label: 'Operational Expense' },
  { value: 'ONLINE_ALLOCATION', label: 'Online Allocation' },
]

function EntryTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-label ${ENTRY_TYPE_COLORS[type] ?? 'text-on-surface bg-surface-container-low'}`}>
      {ENTRY_TYPE_LABELS[type] ?? type}
    </span>
  )
}

function entryDetail(entry) {
  if (entry.entryType === 'HANDOVER') return entry.recipient ?? '—'
  if (entry.entryType === 'EXPENSE') return EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category ?? '—'
  return entry.description ?? 'Online'
}

const inputCls = 'rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-body focus:border-primary focus:outline-none'

export default function EntryHistory() {
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [filters, setFilters] = useState({ entryType: '', dateFrom: '', dateTo: '', search: '', page: 1, limit: 50 })

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, page: key !== 'page' ? 1 : value }))
  }

  const fetchEntries = useCallback(() => {
    const params = {
      ...filters,
      ...(isSuperAdmin ? {} : { branchId }),
    }
    // Remove empty strings
    Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k] })
    return expenseApi.listEntries(params)
  }, [branchId, isSuperAdmin, filters])

  const { data: entries, meta, loading, error } = useApi(fetchEntries, null, [fetchEntries])
  const rows = Array.isArray(entries) ? entries : []
  const total = meta?.total ?? 0
  const totalPages = Math.ceil(total / filters.limit) || 1

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filters.entryType} onChange={(e) => setFilter('entryType', e.target.value)} className={inputCls}>
          {ENTRY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} className={inputCls} placeholder="From" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} className={inputCls} placeholder="To" />
        <input
          type="search" value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className={`${inputCls} min-w-[180px]`} placeholder="Search recipient, description…"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-error font-body text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">receipt_long</span>
            <p className="mt-2 font-body text-sm text-on-surface-variant">No entries found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Date</th>
                <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Type</th>
                <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Details</th>
                <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant sm:table-cell">Method</th>
                <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
                <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant md:table-cell">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {rows.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3 text-on-surface font-body">
                    <div>{formatEntryDate(entry.entryDate)}</div>
                    <div className="text-xs text-on-surface-variant">{formatEntryTime(entry.entryDate)}</div>
                  </td>
                  <td className="px-4 py-3"><EntryTypeBadge type={entry.entryType} /></td>
                  <td className="px-4 py-3 text-on-surface font-body max-w-[200px] truncate">{entryDetail(entry)}</td>
                  <td className="hidden px-4 py-3 text-on-surface-variant font-body sm:table-cell">{PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-headline font-semibold text-on-surface">{formatCurrency(entry.amount)}</td>
                  <td className="hidden px-4 py-3 text-on-surface-variant font-body text-xs md:table-cell">{entry.createdBy?.displayName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between font-body text-sm text-on-surface-variant">
          <span>{total} total entries</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('page', filters.page - 1)}
              disabled={filters.page <= 1}
              className="rounded-lg border border-outline-variant/30 px-3 py-1.5 disabled:opacity-40 hover:bg-surface-container-low"
            >
              Previous
            </button>
            <span>Page {filters.page} of {totalPages}</span>
            <button
              onClick={() => setFilter('page', filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="rounded-lg border border-outline-variant/30 px-3 py-1.5 disabled:opacity-40 hover:bg-surface-container-low"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
