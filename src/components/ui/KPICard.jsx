import Icon from './Icon'

/**
 * Unified KPI tile.
 * Pass either `metric` (sales overview shape) or `title` / `value` / `icon` (dashboard hub shape).
 */
export default function KPICard({
  metric,
  title,
  value,
  icon,
  iconWrapClassName = 'bg-primary-fixed text-primary',
  pill,
}) {
  if (metric) {
    const { label, value: v, icon: ic, iconWrapClassName: wrap, pill: p } = metric
    return (
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className={`rounded-lg p-2 ${wrap}`}>
            <Icon name={ic} />
          </div>
          {p ? <span className={p.className}>{p.text}</span> : null}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{v}</h3>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-none bg-surface-container-lowest p-6 transition-transform hover:scale-[1.02]">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl p-3 ${iconWrapClassName}`}>
          <Icon name={icon} />
        </div>
        {pill ? <span className={pill.className}>{pill.text}</span> : null}
      </div>
      <p className="font-label text-sm text-on-surface-variant">{title}</p>
      <p className="mt-1 font-headline text-3xl font-extrabold text-on-surface">{value}</p>
    </div>
  )
}
