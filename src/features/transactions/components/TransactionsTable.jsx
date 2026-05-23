import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import TransactionRow from './TransactionRow'
import StatusBadge from './StatusBadge'

import { paymentMethodLabel } from '@/constants/paymentMethods'

function paymentLabel(raw) {
  if (!raw || raw === '—') return '—'
  return paymentMethodLabel(raw)
}

function formatMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…')
    out.push(sorted[i])
  }
  return out
}

function TransactionCard({ row }) {
  const navigate = useNavigate()
  const paths = useShellPaths()
  return (
    <div
      className="cursor-pointer rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm transition-colors hover:bg-surface-container-low"
      onClick={() => navigate(paths.transactionDetail(row.orderPk ?? row.id), { state: row })}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate(paths.transactionDetail(row.orderPk ?? row.id), { state: row })
        }
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${row.initialsClass}`}>
              {row.initials}
            </div>
            <p className="truncate font-semibold text-on-surface">{row.studentName}</p>
          </div>
          <p className="text-xs font-medium text-primary">{row.orderId}</p>
          <p className="text-xs text-on-surface-variant">{row.classLabel} · {row.branchName ?? '—'}</p>
          <p className="text-xs text-on-surface-variant">{row.date}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={row.status} />
          <p className="text-sm font-bold text-on-surface">{formatMoney(row.amount)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-secondary-container/50 bg-secondary-container/30 px-2.5 py-0.5 text-xs text-on-secondary-container">
          {paymentLabel(row.kitType)}
        </span>
        {row.remarks ? (
          <span className="max-w-[140px] truncate text-xs text-on-surface-variant">{row.remarks}</span>
        ) : null}
      </div>
    </div>
  )
}

export default function TransactionsTable({
  rows,
  total = 0,
  page = 1,
  pageSize = 100,
  totalPages = 1,
  hasPrev = false,
  hasNext = false,
  onPageChange,
}) {
  const displayTotal = Number(total) || 0
  const start = displayTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const end = displayTotal === 0 ? 0 : Math.min(page * pageSize, displayTotal)
  const pageItems = useMemo(() => buildPageList(page, totalPages), [page, totalPages])

  const footer = (
    <div className="flex flex-col gap-3 border-t border-outline-variant/10 bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <span className="font-label text-xs text-on-surface-variant">
        {displayTotal === 0
          ? 'No transactions found'
          : `Showing ${start.toLocaleString('en-IN')}-${end.toLocaleString('en-IN')} of ${displayTotal.toLocaleString('en-IN')} transactions`}
      </span>
      {displayTotal > 0 && totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasPrev}
            aria-label="Previous page"
            onClick={() => hasPrev && onPageChange?.(page - 1)}
          >
            <span className="material-symbols-outlined text-sm" data-icon="chevron_left" aria-hidden>chevron_left</span>
          </button>
          {pageItems.map((item, idx) =>
            item === '…' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-on-surface-variant">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange?.(item)}
                className={`min-w-[2rem] rounded-lg px-2 py-1 font-body text-xs font-bold transition-colors ${
                  item === page
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-highest text-on-surface'
                }`}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasNext}
            aria-label="Next page"
            onClick={() => hasNext && onPageChange?.(page + 1)}
          >
            <span className="material-symbols-outlined text-sm" data-icon="chevron_right" aria-hidden>chevron_right</span>
          </button>
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">No transactions found.</p>
        ) : (
          rows.map((row) => <TransactionCard key={row.id} row={row} />)
        )}
        <div className="overflow-hidden rounded-xl border border-outline-variant/10">{footer}</div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="w-12 px-3 py-4 text-center font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">S.No</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Order ID</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Date</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Student Name</th>
                <th className="hidden px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:table-cell">Class</th>
                <th className="hidden px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:table-cell">Branch</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Payment Method</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Status</th>
                <th className="hidden px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:table-cell">Remarks</th>
                <th className="px-6 py-4 text-right font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {rows.map((row) => (
                <TransactionRow key={row.id} row={row} serialNo={row.serialNo ?? 0} />
              ))}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    </>
  )
}
