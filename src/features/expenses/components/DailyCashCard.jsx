import { formatCurrency } from '../expenseConstants'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 h-4 w-32 rounded bg-surface-container-high" />
      <div className="mb-4 h-3 w-20 rounded bg-surface-container-high" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-28 rounded bg-surface-container-high" />
            <div className="h-3 w-16 rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DailyCashCard({ summary, loading, onRecordEntry }) {
  if (loading) return <SkeletonCard />
  if (!summary) return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm text-center text-on-surface-variant font-body text-sm py-8">
      No data available
    </div>
  )

  const {
    branch,
    openingBalance,
    cashCollected,
    totalAvailable,
    handovers,
    expenses,
    onlineAllocations,
    closingBalance,
    isNegative,
    entryCount,
  } = summary

  const rows = [
    { label: 'Opening Balance', value: openingBalance, icon: 'account_balance_wallet', muted: true },
    { label: 'Cash Collected', value: cashCollected, icon: 'add_circle', positive: true },
    { label: 'Total Available', value: totalAvailable, icon: 'calculate', bold: true, divider: true },
    { label: 'Handovers', value: -handovers, icon: 'arrow_upward', negative: true },
    { label: 'Expenses', value: -expenses, icon: 'receipt_long', negative: true },
  ]

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/20">
        <p className="font-headline text-base font-semibold text-on-surface">{branch?.name ?? 'Branch'}</p>
        <p className="text-xs text-on-surface-variant font-body mt-0.5">{entryCount} entr{entryCount === 1 ? 'y' : 'ies'} today</p>
      </div>

      {/* Balance rows */}
      <div className="px-4 py-3 space-y-2">
        {rows.map((row) => (
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
                {row.negative ? `−${formatCurrency(Math.abs(row.value))}` : formatCurrency(row.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Closing balance highlight */}
      <div className={`mx-3 mb-3 rounded-xl px-4 py-3 flex items-center justify-between ${isNegative ? 'bg-error-container' : 'bg-primary/10'}`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${isNegative ? 'text-error' : 'text-primary'}`}>
            {isNegative ? 'warning' : 'check_circle'}
          </span>
          <span className={`font-body text-sm font-semibold ${isNegative ? 'text-error' : 'text-primary'}`}>Closing Balance</span>
        </div>
        <span className={`font-headline text-base font-bold ${isNegative ? 'text-error' : 'text-primary'}`}>
          {formatCurrency(closingBalance)}
        </span>
      </div>

      {/* Online allocations (informational, no effect on cash balance) */}
      {onlineAllocations > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-body">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">phone_android</span>
              Online allocations (info only)
            </span>
            <span>{formatCurrency(onlineAllocations)}</span>
          </div>
        </div>
      )}

      {/* Record Entry CTA */}
      {onRecordEntry && (
        <div className="px-4 pb-4">
          <button
            onClick={onRecordEntry}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary font-body hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Record Entry
          </button>
        </div>
      )}
    </div>
  )
}
