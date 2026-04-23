export default function FinanceSummary() {
  return (
    <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
            <span className="material-symbols-outlined" data-icon="trending_up" aria-hidden>
              trending_up
            </span>
          </div>
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">+12.5%</span>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Total Sales</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">$128,450.00</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container text-error">
            <span className="material-symbols-outlined" data-icon="receipt_long" aria-hidden>
              receipt_long
            </span>
          </div>
          <span className="rounded-full bg-error-container/30 px-2 py-1 text-xs font-bold text-error">+4.2%</span>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Total Expenses</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">$42,120.00</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm ring-2 ring-primary/5 transition-transform hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined" data-icon="account_balance_wallet" aria-hidden>
              account_balance_wallet
            </span>
          </div>
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">+18.3%</span>
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Net Profit</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-primary">$86,330.00</p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-1">
        <p className="mb-4 text-sm font-medium text-on-surface-variant">Payment Methods</p>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-bold">
              <span className="text-on-surface">Online (68%)</span>
              <span className="text-primary">$87,346</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-container"
                style={{ width: '68%' }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-bold">
              <span className="text-on-surface">Cash (32%)</span>
              <span className="text-on-surface-variant">$41,104</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full bg-secondary" style={{ width: '32%' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
