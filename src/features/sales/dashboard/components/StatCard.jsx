export default function StatCard({ stat }) {
  const { label, value, icon, iconWrapClassName, topRight } = stat

  return (
    <div className="group flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-8 transition-all duration-300 hover:bg-surface-container-low">
      <div className="mb-6 flex items-start justify-between">
        <div className={iconWrapClassName}>
          <span className="material-symbols-outlined" data-icon={icon} aria-hidden>
            {icon}
          </span>
        </div>
        {topRight.kind === 'text' && (
          <span className={topRight.className}>{topRight.text}</span>
        )}
        {topRight.kind === 'pill' && (
          <span className={topRight.className}>{topRight.text}</span>
        )}
        {topRight.kind === 'pulseDot' && (
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" aria-hidden />
        )}
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-on-surface-variant">{label}</span>
        <h4 className="headline text-5xl font-extrabold">{value}</h4>
      </div>
    </div>
  )
}
