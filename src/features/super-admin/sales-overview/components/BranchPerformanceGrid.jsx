import { formatUsd } from '../salesOverviewMappers'

function branchInitials(branch) {
  const raw = (branch.code || branch.name || '?').trim()
  if (raw.length >= 2) return raw.slice(0, 2).toUpperCase()
  return `${raw.slice(0, 1).toUpperCase()}•`
}

/**
 * @param {{ branches: Array<{ id: string, name: string, code?: string, totalOrders?: number, revenue?: number, pendingRevenue?: number }>, loading?: boolean, error?: string | null }} props
 */
export default function BranchPerformanceGrid({ branches, loading, error }) {
  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Branch Performance</h3>
      </div>
      {error ? (
        <p className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          Could not load branch performance: {error}
        </p>
      ) : loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(branches ?? []).map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 shadow-sm transition-colors hover:border-primary/15"
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                  style={{ backgroundColor: 'rgb(219 234 254)', color: 'rgb(30 64 175)' }}
                >
                  {branchInitials(b)}
                </div>
                <h4 className="text-lg font-bold text-on-surface">{b.name}</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
                  <span className="text-sm text-on-surface-variant">Total Orders</span>
                  <span className="font-bold text-on-surface">{(b.totalOrders ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
                  <span className="text-sm text-on-surface-variant">Revenue</span>
                  <span className="font-bold text-on-surface">{formatUsd(b.revenue)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Pending Revenue</span>
                  <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                    {formatUsd(b.pendingRevenue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {(branches ?? []).length === 0 && (
            <p className="col-span-full text-sm text-on-surface-variant">No branch data for this period.</p>
          )}
        </div>
      )}
    </section>
  )
}
