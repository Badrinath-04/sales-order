const rows = [
  {
    id: '1',
    date: 'Apr 12, 2026',
    student: 'Alex Johnson',
    classLabel: 'Class 10-A',
    branch: 'Central',
    method: 'Online',
    methodIcon: 'credit_card',
    methodIconClass: 'text-primary',
    amount: '$145.00',
    status: 'paid',
  },
  {
    id: '2',
    date: 'Apr 11, 2026',
    student: 'Sarah Mitchell',
    classLabel: 'Class 8-C',
    branch: 'Westside',
    method: 'Cash',
    methodIcon: 'payments',
    methodIconClass: 'text-secondary',
    amount: '$85.50',
    status: 'paid',
  },
  {
    id: '3',
    date: 'Apr 11, 2026',
    student: 'James Wilson',
    classLabel: 'Class 10-B',
    branch: 'East End',
    method: 'Online',
    methodIcon: 'credit_card',
    methodIconClass: 'text-primary',
    amount: '$220.00',
    status: 'pending',
  },
  {
    id: '4',
    date: 'Apr 10, 2026',
    student: 'Emma Thompson',
    classLabel: 'Class 9-A',
    branch: 'Central',
    method: 'Cash',
    methodIcon: 'payments',
    methodIconClass: 'text-secondary',
    amount: '$112.00',
    status: 'paid',
  },
]

function StatusBadge({ status }) {
  if (status === 'paid') {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-700">
        Paid
      </span>
    )
  }
  return (
    <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-tertiary-fixed-variant">
      Pending
    </span>
  )
}

export default function TransactionsTable() {
  return (
    <section className="mb-12 overflow-hidden rounded-[2.5rem] bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
        <h3 className="font-headline text-xl font-bold text-on-surface">Recent Transactions</h3>
        <div className="flex gap-4">
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant"
              data-icon="search"
              aria-hidden
            >
              search
            </span>
            <input
              className="w-64 rounded-xl border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary"
              placeholder="Search students..."
              type="search"
              name="reports-tx-search"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-sm" data-icon="tune" aria-hidden>
              tune
            </span>
            Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low/50 text-left">
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Student &amp; Class
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Branch</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Method</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Amount
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
              <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-surface-container-low/30">
                <td className="px-8 py-5 text-sm font-medium">{row.date}</td>
                <td className="px-6 py-5">
                  <p className="text-sm font-bold text-on-surface">{row.student}</p>
                  <p className="text-xs text-on-surface-variant">{row.classLabel}</p>
                </td>
                <td className="px-6 py-5">
                  <span className="rounded-lg bg-surface-container px-2 py-1 text-xs font-semibold">{row.branch}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-sm ${row.methodIconClass}`}
                      data-icon={row.methodIcon}
                      aria-hidden
                    >
                      {row.methodIcon}
                    </span>
                    <span className="text-sm">{row.method}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right text-sm font-bold">{row.amount}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-8 py-5 text-center">
                  <button
                    type="button"
                    className="text-sm font-bold text-primary hover:text-primary-container"
                  >
                    View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-surface-container-low/30 p-6">
        <p className="text-sm font-medium text-on-surface-variant">Showing 1 to 4 of 128 transactions</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/30 transition-colors hover:bg-white disabled:opacity-50"
            disabled
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-sm" data-icon="chevron_left" aria-hidden>
              chevron_left
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary"
          >
            1
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/30 text-sm font-bold transition-colors hover:bg-white"
          >
            2
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/30 transition-colors hover:bg-white"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-sm" data-icon="chevron_right" aria-hidden>
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
