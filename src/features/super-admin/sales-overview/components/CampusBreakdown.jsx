import { campuses } from '../data'

export default function CampusBreakdown() {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <h4 className="mb-4 font-headline text-base font-bold text-on-surface">Campus Sales Breakdown</h4>
      <div className="space-y-4">
        {campuses.map((c) => (
          <div key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-xs font-bold">
                {c.letter}
              </div>
              <div>
                <p className="text-sm font-bold">{c.name}</p>
                <p className="text-[10px] text-on-surface-variant">{c.orders} Orders</p>
              </div>
            </div>
            <p className="text-sm font-bold">{c.revenue}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
