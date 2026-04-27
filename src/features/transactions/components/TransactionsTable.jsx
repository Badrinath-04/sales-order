import TransactionRow from './TransactionRow'

export default function TransactionsTable({ rows, total }) {
  const displayTotal = total ?? rows.length

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Order ID
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Date
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Student Name
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Class
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Payment Method
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Amount
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Remarks
              </th>
              <th className="px-6 py-4 text-right font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {rows.map((row) => (
              <TransactionRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low px-6 py-4">
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
              <span className="material-symbols-outlined text-sm" data-icon="chevron_left" aria-hidden>
                chevron_left
              </span>
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1 font-body text-xs font-bold text-on-primary"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-lg p-2 transition-colors hover:bg-surface-container-highest"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-sm" data-icon="chevron_right" aria-hidden>
                chevron_right
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
