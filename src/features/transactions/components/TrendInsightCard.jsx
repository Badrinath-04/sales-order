export default function TrendInsightCard() {
  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-20 flex max-w-xs flex-col items-end gap-4">
      <div className="pointer-events-auto rounded-xl border border-primary/10 bg-surface-container-lowest p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-container p-2">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
              data-icon="insights"
              aria-hidden
            >
              insights
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">Weekly Trend</p>
            <p className="mt-1 text-[10px] leading-relaxed text-on-surface-variant">
              Transaction volume is up 14% compared to last week. Most orders are for &quot;Winter Uniform&quot;
              kits.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
