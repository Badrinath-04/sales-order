function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

export default function BranchPerformance({ data, loading }) {
  const branches = data ?? []

  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Branch Performance</h3>
      </div>
      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="rounded-[2.5rem] border border-transparent bg-surface-container-low p-8 transition-colors hover:border-primary/10"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-primary shadow-sm">
                  {b.code?.slice(0, 2)}
                </div>
                <h4 className="text-lg font-bold">{b.name}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-sm text-on-surface-variant">Total Orders</span>
                  <span className="font-bold">{b.totalOrders?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span className="text-sm text-on-surface-variant">Revenue</span>
                  <span className="font-bold">{formatCurrency(b.revenue)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-on-surface">Pending Payments</span>
                  <span className="text-lg font-extrabold text-tertiary">{b.pendingPayments}</span>
                </div>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <p className="col-span-3 text-sm text-on-surface-variant">No branch data available.</p>
          )}
        </div>
      )}
    </section>
  )
}
