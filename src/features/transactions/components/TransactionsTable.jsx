import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import TransactionRow from './TransactionRow'
import StatusBadge from './StatusBadge'

const METHOD_LABELS = {
  CASH: 'Cash', ONLINE: 'Online / NEFT', CARD: 'Card', CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer', GPAY: 'Google Pay', PHONEPE: 'PhonePe',
  PAYTM: 'Paytm', CREDIT: 'Credit', OTHER: 'Other',
}

function paymentLabel(raw) {
  if (!raw || raw === '—') return '—'
  return METHOD_LABELS[raw.toUpperCase()] ?? raw
}

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`
}

function TransactionCard({ row }) {
  const navigate = useNavigate()
  const paths = useShellPaths()
  return (
    <div
      className="cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm transition-colors hover:bg-surface-container-low"
      onClick={() => navigate(paths.transactionDetail(row.id), { state: row })}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(paths.transactionDetail(row.id), { state: row }) }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${row.initialsClass}`}>
              {row.initials}
            </div>
            <p className="font-semibold text-on-surface truncate">{row.studentName}</p>
          </div>
          <p className="text-xs text-primary font-medium">{row.orderId}</p>
          <p className="text-xs text-on-surface-variant">{row.classLabel} · {row.date}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <StatusBadge status={row.status} />
          <p className="text-sm font-bold text-on-surface">{formatMoney(row.amount)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-secondary-container/50 bg-secondary-container/30 px-2.5 py-0.5 text-xs text-on-secondary-container">
          {paymentLabel(row.kitType)}
        </span>
        {row.remarks && (
          <span className="max-w-[140px] truncate text-xs text-on-surface-variant">{row.remarks}</span>
        )}
      </div>
    </div>
  )
}

export default function TransactionsTable({ rows, total }) {
  const displayTotal = total ?? rows.length

  const footer = (
    <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low px-4 md:px-6 py-4">
      <span className="font-label text-xs text-on-surface-variant">
        {displayTotal === 0
          ? 'No transactions found'
          : `Showing 1-${rows.length} of ${displayTotal.toLocaleString()} transactions`}
      </span>
      {displayTotal > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-surface-container-highest disabled:opacity-50"
            disabled
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-sm" data-icon="chevron_left" aria-hidden>chevron_left</span>
          </button>
          <button type="button" className="rounded-lg bg-primary px-3 py-1 font-body text-xs font-bold text-on-primary">1</button>
          <button type="button" className="rounded-lg p-2 transition-colors hover:bg-surface-container-highest" aria-label="Next page">
            <span className="material-symbols-outlined text-sm" data-icon="chevron_right" aria-hidden>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">No transactions found.</p>
        ) : (
          rows.map((row) => <TransactionCard key={row.id} row={row} />)
        )}
        <div className="rounded-xl overflow-hidden border border-outline-variant/10">
          {footer}
        </div>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Order ID</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Date</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Student Name</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Class</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Payment Method</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Remarks</th>
                <th className="px-6 py-4 text-right font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {rows.map((row) => (
                <TransactionRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    </>
  )
}
