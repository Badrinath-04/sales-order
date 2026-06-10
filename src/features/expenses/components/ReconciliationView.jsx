import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { expenseApi } from '../expenseApi'
import {
  ENTRY_TYPE_LABELS, ENTRY_TYPE_COLORS, EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS, formatCurrency, formatEntryTime,
} from '../expenseConstants'

function EntryTypeBadge({ type }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold font-label ${ENTRY_TYPE_COLORS[type] ?? 'text-on-surface bg-surface-container-low'}`}>
      {ENTRY_TYPE_LABELS[type] ?? type}
    </span>
  )
}

function entryDetail(entry) {
  if (entry.entryType === 'HANDOVER') return entry.recipient ?? '—'
  if (entry.entryType === 'EXPENSE') return EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category ?? '—'
  return entry.description ?? 'Online'
}

export default function ReconciliationView() {
  const { branchId } = useAdminSession()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const fetchRecon = useCallback(
    () => (branchId ? expenseApi.getReconciliation({ branchId, date }) : null),
    [branchId, date],
  )
  const { data: recon, loading, error } = useApi(fetchRecon, null, [branchId, date])

  const summaryRows = recon ? [
    { label: 'Opening Balance',  value: recon.openingBalance,      icon: 'account_balance_wallet', muted: true },
    { label: 'Cash Collected',   value: recon.cashCollected,        icon: 'add_circle',   positive: true },
    { label: 'Total Available',  value: recon.totalCashAvailable,   icon: 'calculate',    bold: true, divider: true },
    { label: 'Handovers',        value: recon.handovers,            icon: 'arrow_upward', negative: true },
    { label: 'Expenses',         value: recon.expenses,             icon: 'receipt_long', negative: true },
  ] : []

  return (
    <div>
      {/* Date picker */}
      <div className="mb-6 flex items-center gap-3">
        <label className="font-body text-sm font-semibold text-on-surface-variant">Date</label>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-body focus:border-primary focus:outline-none"
        />
        {recon?.branch && (
          <span className="font-body text-sm text-on-surface-variant">{recon.branch.name}</span>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !branchId ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center font-body text-sm text-on-surface-variant">
          Select a branch to view reconciliation
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error/20 bg-error-container p-6 text-error font-body text-sm">{error}</div>
      ) : recon ? (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden max-w-md">
            <div className="px-5 pt-4 pb-3 border-b border-outline-variant/20">
              <p className="font-headline text-base font-semibold text-on-surface">
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="px-5 py-3 space-y-2">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  {row.divider && <div className="border-t border-outline-variant/30 my-2" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-base ${row.muted ? 'text-on-surface-variant' : row.positive ? 'text-primary' : row.negative ? 'text-error' : 'text-on-surface'}`}>
                        {row.icon}
                      </span>
                      <span className={`font-body text-sm ${row.bold ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{row.label}</span>
                    </div>
                    <span className={`font-headline text-sm font-semibold ${row.negative ? 'text-error' : row.positive ? 'text-primary' : 'text-on-surface'}`}>
                      {row.negative ? `−${formatCurrency(row.value)}` : formatCurrency(row.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Closing balance */}
            <div className={`mx-3 mb-3 rounded-xl px-4 py-3 flex items-center justify-between ${recon.isNegative ? 'bg-error-container' : 'bg-primary/10'}`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${recon.isNegative ? 'text-error' : 'text-primary'}`}>
                  {recon.isNegative ? 'warning' : 'check_circle'}
                </span>
                <span className={`font-body text-sm font-semibold ${recon.isNegative ? 'text-error' : 'text-primary'}`}>Closing Balance</span>
              </div>
              <span className={`font-headline text-base font-bold ${recon.isNegative ? 'text-error' : 'text-primary'}`}>
                {formatCurrency(recon.closingBalance)}
              </span>
            </div>
            {/* Online allocations */}
            {recon.onlineAllocations > 0 && (
              <div className="px-5 pb-4 text-xs text-on-surface-variant font-body flex justify-between">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">phone_android</span>
                  Online allocations (info only)
                </span>
                <span>{formatCurrency(recon.onlineAllocations)}</span>
              </div>
            )}
          </div>

          {/* Entry log */}
          {recon.entries?.length > 0 && (
            <div>
              <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Entry Log ({recon.entries.length})
              </p>
              <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Time</th>
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Type</th>
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Details</th>
                      <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant sm:table-cell">Method</th>
                      <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
                      <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant md:table-cell">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {recon.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3 text-on-surface-variant font-body text-xs">{formatEntryTime(entry.entryDate)}</td>
                        <td className="px-4 py-3"><EntryTypeBadge type={entry.entryType} /></td>
                        <td className="px-4 py-3 text-on-surface font-body max-w-[160px] truncate">{entryDetail(entry)}</td>
                        <td className="hidden px-4 py-3 text-on-surface-variant font-body sm:table-cell">{PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-headline font-semibold text-on-surface">{formatCurrency(entry.amount)}</td>
                        <td className="hidden px-4 py-3 text-on-surface-variant font-body text-xs md:table-cell">{entry.createdBy?.displayName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recon.entries?.length === 0 && (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">event_available</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">No entries recorded for this date</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
