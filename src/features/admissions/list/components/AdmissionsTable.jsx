const STATUS_STYLES = {
  PAID: 'bg-green-500/10 text-green-700 dark:text-green-400',
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

const METHOD_LABELS = {
  CASH: 'Cash',
  ONLINE: 'Online',
  CANARA_UPI: 'Canara Bank',
  UPI: 'UPI',
  CARD: 'Card',
  SPLIT: 'Split',
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function AdmissionsTable({ admissions, loading, onRowClick }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-sm text-on-surface-variant">
        Loading admissions…
      </div>
    )
  }

  if (!admissions?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">person_search</span>
        <p className="text-sm font-medium text-on-surface">No admissions found</p>
        <p className="text-xs text-on-surface-variant">Try adjusting your filters or add a new admission above.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-xs uppercase tracking-wide text-on-surface-variant">
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Parent Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Class &amp; Section</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Remarks</th>
              <th className="px-4 py-3 font-semibold">Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((adm) => {
              const lastTxn = adm.transactions?.[0]
              return (
                <tr
                  key={adm.id}
                  onClick={() => onRowClick?.(adm)}
                  className="cursor-pointer border-b border-outline-variant/15 transition-colors last:border-b-0 hover:bg-primary/5"
                >
                  <td className="px-4 py-3 font-medium text-on-surface">{adm.studentName}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{adm.parentName || '—'}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{adm.phone}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{adm.classLabel}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(adm.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[adm.paymentStatus] ?? ''}`}>
                      {adm.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{lastTxn ? METHOD_LABELS[lastTxn.paymentMethod] ?? lastTxn.paymentMethod : '—'}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-on-surface-variant" title={adm.remarks || ''}>{adm.remarks || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatDateTime(adm.createdAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
