import { Link, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'

function RecentStatusBadge({ status }) {
  if (status === 'paid') {
    return (
      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-secondary-container">
        Paid
      </span>
    )
  }
  return (
    <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-tertiary-fixed">
      Pending
    </span>
  )
}

export default function CampusSalesView({ campus, data }) {
  const navigate = useNavigate()
  const paths = useShellPaths()

  if (!data) return null

  const {
    sales,
    salesVsYesterday,
    completed,
    completedBadge,
    pending,
    recentTransactions,
    insight,
    insightImageUrl,
    inventorySnapshots,
  } = data

  return (
    <div data-campus={campus}>
      <section className="mb-12 flex flex-col items-center justify-center rounded-[2rem] bg-surface-container-lowest py-12 shadow-sm">
        <div className="mb-8 text-center">
          <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">Ready for the next customer?</h3>
          <p className="text-sm font-medium text-on-surface-variant">
            Process a new kit sale or student equipment request in seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(paths.ordersNew)}
          className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-5 text-lg font-bold text-on-primary shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" data-icon="add_shopping_cart" aria-hidden>
            add_shopping_cart
          </span>
          <span>+ New Order</span>
        </button>
      </section>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:bg-surface-container-low">
          <div className="mb-6 flex items-start justify-between">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <span className="material-symbols-outlined" data-icon="payments" aria-hidden>
                payments
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-tertiary">{salesVsYesterday}</span>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Today&apos;s Sales</span>
            <h4 className="font-headline text-5xl font-extrabold text-on-surface">${sales}</h4>
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
              {completedBadge}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Orders Completed</span>
            <h4 className="font-headline text-5xl font-extrabold text-on-surface">{completed}</h4>
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
            <h4 className="font-headline text-5xl font-extrabold text-on-surface">{pending}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold text-on-surface">Recent Transactions</h3>
            <Link to={paths.transactions} className="text-sm font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentTransactions.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-5 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
                    <span className="material-symbols-outlined text-outline" data-icon={row.icon} aria-hidden>
                      {row.icon}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-on-surface">{row.product}</h5>
                    <p className="text-xs text-on-surface-variant">
                      {row.student} • {row.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="mb-1 block text-sm font-bold text-on-surface">{row.amount}</span>
                  <RecentStatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="relative flex min-h-[300px] h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-primary p-8 text-on-primary">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute left-10 top-20 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
            {insightImageUrl ? (
              <img
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
                src={insightImageUrl}
              />
            ) : null}
            <div className="relative z-10">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">Quick Insight</span>
              <h4 className="mb-4 text-2xl font-bold leading-tight">{insight}</h4>
              <button
                type="button"
                onClick={() => navigate(paths.stock)}
                className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-white/90"
              >
                Order More
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inventorySnapshots.map((snap) => (
          <div key={snap.id} className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
              <span className="material-symbols-outlined" data-icon={snap.icon} aria-hidden>
                {snap.icon}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">{snap.label}</p>
              <p className="text-sm font-bold text-on-surface">{snap.countLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
