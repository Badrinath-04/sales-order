function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinanceSummary({ data, loading }) {
  const totalRevenue = data?.totalRevenue ?? 0
  const totalOrders = data?.totalOrders ?? 0
  const pendingRevenue = data?.pendingRevenue ?? 0
  const avgOrderValue = data?.avgOrderValue ?? 0

  return (
    <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <span className="material-symbols-outlined" aria-hidden>trending_up</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Total Revenue</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">
            {loading ? '…' : formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container text-error">
            <span className="material-symbols-outlined" aria-hidden>receipt_long</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Total Orders</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">
            {loading ? '…' : totalOrders.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm ring-2 ring-primary/5 transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined" aria-hidden>account_balance_wallet</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Avg Order Value</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-primary">
            {loading ? '…' : formatCurrency(avgOrderValue)}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary">
            <span className="material-symbols-outlined" aria-hidden>pending_actions</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Pending Revenue</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">
            {loading ? '…' : formatCurrency(pendingRevenue)}
          </p>
        </div>
      </div>
    </section>
  )
}
