export default function PublisherDirectory({ publishers, loading, onSelect, onRefresh }) {
  if (loading) return <p className="text-sm text-on-surface-variant">Loading publishers…</p>

  if (publishers.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">store</span>
        <p className="mt-3 font-bold text-on-surface">No publishers yet</p>
        <p className="text-sm text-on-surface-variant">Add your first publisher using the button above.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {publishers.map((p) => {
        const balance = Number(p.pendingBalance ?? 0)
        const balanceClass = balance > 0
          ? (balance >= 100000 ? 'text-error' : 'text-amber-600')
          : 'text-emerald-600'
        return (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-on-surface">{p.name}</p>
                {p.contactPerson && <p className="text-xs text-on-surface-variant">{p.contactPerson}</p>}
                {p.phone && <p className="text-xs text-on-surface-variant">{p.phone}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                {p.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Procured</p>
                <p className="mt-0.5 font-bold text-on-surface">₹{Number(p.totalProcured ?? 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Paid</p>
                <p className="mt-0.5 font-bold text-emerald-600">₹{Number(p.totalPaid ?? 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Balance</p>
                <p className={`mt-0.5 font-bold ${balanceClass}`}>₹{balance.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-on-surface-variant">
              Last payment: {p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString('en-IN') : 'No payments yet'}
            </p>

            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className="mt-4 w-full rounded-xl bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              View Details
            </button>
          </div>
        )
      })}
    </div>
  )
}
