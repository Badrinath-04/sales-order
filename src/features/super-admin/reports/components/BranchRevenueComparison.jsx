const bars = [
  { id: 'central', label: 'Central', heightPct: 85, barClass: 'bg-primary-container group-hover:bg-primary' },
  { id: 'westside', label: 'Westside', heightPct: 65, barClass: 'bg-secondary-container group-hover:bg-secondary' },
  { id: 'east', label: 'East End', heightPct: 45, barClass: 'bg-primary-fixed group-hover:bg-primary-container' },
  { id: 'others', label: 'Others', heightPct: 25, barClass: 'bg-outline-variant/30' },
]

export default function BranchRevenueComparison() {
  return (
    <div className="rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="font-headline text-xl font-bold text-on-surface">Branch Revenue Comparison</h3>
        <span className="material-symbols-outlined text-on-surface-variant" data-icon="more_horiz" aria-hidden>
          more_horiz
        </span>
      </div>
      <div className="flex h-64 items-end justify-around pt-4">
        {bars.map((b) => (
          <div key={b.id} className="group flex w-12 flex-col items-center gap-3">
            <div
              className={`w-full rounded-t-xl transition-colors ${b.barClass}`}
              style={{ height: `${b.heightPct}%` }}
            />
            <span className="text-[10px] font-bold text-on-surface-variant">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
