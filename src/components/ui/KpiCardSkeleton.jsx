/** Pulsing placeholder matching KPICard layout (reports / dashboard). */
export default function KpiCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-surface-container-high" />
        <div className="h-5 w-16 rounded-full bg-surface-container-high" />
      </div>
      <div className="mb-2 h-3 w-28 rounded bg-surface-container-high" />
      <div className="h-8 w-32 rounded bg-surface-container-high" />
    </div>
  )
}
