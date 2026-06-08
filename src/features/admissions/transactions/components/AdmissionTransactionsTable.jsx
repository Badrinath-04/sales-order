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
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function AdmissionTransactionsTable({ transactions, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-sm text-on-surface-variant">
        Loading transactions…
      </div>
    )
  }

  if (!transactions?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">receipt_long</span>
        <p className="text-sm font-medium text-on-surface">No admission transactions yet</p>
        <p className="text-xs text-on-surface-variant">Recorded payments will appear here — isolated from Books &amp; Uniform transactions.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-xs uppercase tracking-wide text-on-surface-variant">
              <th className="px-4 py-3 font-semibold">Admission Code</th>
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Class &amp; Section</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Processed By</th>
              <th className="px-4 py-3 font-semibold">Branch</th>
              <th className="px-4 py-3 font-semibold">Paid On</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-outline-variant/15 last:border-b-0 hover:bg-primary/5">
                <td className="px-4 py-3 font-medium text-on-surface">{txn.admission?.admissionCode ?? '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{txn.admission?.studentName ?? '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{txn.admission?.classLabel ?? '—'}</td>
                <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(txn.amount)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{METHOD_LABELS[txn.paymentMethod] ?? txn.paymentMethod}</td>
                <td className="px-4 py-3 text-on-surface-variant">{txn.processedBy?.displayName ?? '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{txn.branch?.name ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatDateTime(txn.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
