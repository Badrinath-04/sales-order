import { salesInsights } from '../data'

export default function InsightsCard() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-lg">
      <h4 className="mb-4 text-sm font-extrabold uppercase tracking-widest opacity-90">Sales Insights</h4>
      <div className="space-y-4">
        {salesInsights.map((row) => (
          <div key={row.id} className="flex gap-3">
            <span className={row.iconClassName} data-icon={row.icon} aria-hidden>
              {row.icon}
            </span>
            <div>
              <p className="text-xs font-bold">{row.title}</p>
              <p className="text-sm">{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
