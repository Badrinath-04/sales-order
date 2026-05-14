/**
 * Primary “Quick insight” panel (gradient overlay on optional image).
 */
export default function InsightCard({
  eyebrow = 'Quick Insight',
  title,
  description,
  imageUrl,
  ctaLabel,
  onCtaClick,
  minHeightClassName = 'min-h-[300px]',
}) {
  return (
    <div
      className={`relative flex ${minHeightClassName} h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-primary p-8 text-on-primary`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-20 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      {imageUrl ? (
        <img alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" src={imageUrl} />
      ) : null}
      <div className="relative z-10">
        {eyebrow ? (
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">{eyebrow}</span>
        ) : null}
        <h4 className="mb-4 text-2xl font-bold leading-tight">{title}</h4>
        {description ? <p className="mb-4 text-sm opacity-90">{description}</p> : null}
        {ctaLabel ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-white/90"
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
