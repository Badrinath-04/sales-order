export default function KPISection() {
  return (
    <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <span className="material-symbols-outlined" data-icon="payments" aria-hidden>
              payments
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-tertiary">+12% vs yesterday</span>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Today&apos;s Sales</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">$850</h4>
        </div>
      </div>

      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-secondary-container/30 p-3 text-secondary">
            <span className="material-symbols-outlined" data-icon="task_alt" aria-hidden>
              task_alt
            </span>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
            On Track
          </span>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Orders Completed</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">12</h4>
        </div>
      </div>

      <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-xl bg-tertiary/10 p-3 text-tertiary">
            <span className="material-symbols-outlined" data-icon="pending_actions" aria-hidden>
              pending_actions
            </span>
          </div>
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" aria-hidden />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-on-surface-variant">Pending Orders</span>
          <h4 className="font-headline text-5xl font-extrabold text-on-surface">3</h4>
        </div>
      </div>
    </div>
  )
}
