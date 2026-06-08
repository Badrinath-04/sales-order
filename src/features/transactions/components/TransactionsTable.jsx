import { useMemo } from 'react'
import TransactionRow from './TransactionRow'

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

export default function TransactionsTable({
  rows,
  total = 0,
  page = 1,
  pageSize = 100,
  itemLabel = 'transactions',
  totalPages = 1,
  hasPrev = false,
  hasNext = false,
  onPageChange,
  listReturnPath,
}) {
  const displayTotal = Number(total) || 0
  const start = displayTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const end = displayTotal === 0 ? 0 : Math.min(page * pageSize, displayTotal)
  const pageItems = useMemo(() => buildPageList(page, totalPages), [page, totalPages])

  const footer = (
    <div className="flex flex-col gap-3 border-t border-outline-variant/10 bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <span className="font-label text-xs text-on-surface-variant">
        {displayTotal === 0
          ? `No ${itemLabel} found`
          : `Showing ${start.toLocaleString('en-IN')}-${end.toLocaleString('en-IN')} of ${displayTotal.toLocaleString('en-IN')} ${itemLabel}`}
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
    <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
      <div className="transactions-table-scroll">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="w-12 px-3 py-4 text-center font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">S.No</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Order ID</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Date</th>
              <th className="transactions-table-student-col px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Student Name</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Class</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Branch</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Payment Method</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Amount</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Status</th>
              <th className="px-4 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Remarks</th>
              <th className="px-4 py-4 text-right font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant lg:px-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                  No {itemLabel} found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <TransactionRow key={row.id} row={row} serialNo={row.serialNo ?? 0} listReturnPath={listReturnPath} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
