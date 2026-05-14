const accentBarClass = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
}

export default function ActivityFeed({ activities }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6">
      <h3 className="font-headline text-lg font-bold text-on-surface">Recent Activity</h3>
      <div className="mt-6 space-y-6">
        {activities.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div
              className={`w-1 shrink-0 rounded-full ${accentBarClass[item.accent] ?? accentBarClass.primary}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">{item.title}</p>
              <p className="text-xs text-on-surface-variant">{item.detail}</p>
              <p className="mt-1 text-[10px] text-outline">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
