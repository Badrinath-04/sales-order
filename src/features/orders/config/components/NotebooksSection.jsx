/**
 * NotebooksSection
 *
 * Full Bundle — read-only summary of what is included and the bundle total.
 * Selected Sub-items — full grid with checkboxes, steppers, and per-line totals.
 */

import StyledDropdown from '@/components/ui/StyledDropdown'

export default function NotebooksSection({
  notebookBundle,
  quantities = {},
  onQuantityChange,
  bundleMode = 'full',
  onBundleModeChange,
  loading,
}) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
        <div className="mb-4 flex items-center gap-3 md:mb-8">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-6 w-40 animate-pulse rounded-lg bg-surface-container" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (!notebookBundle) {
    return (
      <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
        <div className="mb-4 flex items-center gap-3 md:mb-8">
          <div className="rounded-xl bg-secondary/10 p-2">
            <span className="material-symbols-outlined text-secondary" aria-hidden>library_books</span>
          </div>
          <h3 className="font-headline text-lg font-bold md:text-xl">Notebooks</h3>
        </div>
        <p className="rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant">
          No notebook bundle configured for this class.
        </p>
      </div>
    )
  }

  const subItems = (notebookBundle.subItems ?? []).filter((s) => s.isActive !== false)
  const computedBundleTotal = subItems.reduce((sum, sub) => {
    const qty = quantities[sub.id] ?? sub.quantity ?? 0
    return sum + Math.ceil(Number(sub.price ?? 33) * qty)
  }, 0)
  const defaultTotal = Number(notebookBundle.setPrice ?? 0)
  const isDefaultSelection = subItems.every((sub) => Number(quantities[sub.id] ?? sub.quantity ?? 0) === Number(sub.quantity ?? 0))
  const bundleTotal =
    bundleMode === 'full' && isDefaultSelection && defaultTotal > 0 ? defaultTotal : computedBundleTotal

  const defaultBookCount = subItems.reduce((n, s) => n + Number(s.quantity ?? 0), 0)

  const handleModeChange = (next) => {
    if (typeof onBundleModeChange === 'function') onBundleModeChange(next)
  }

  const subtitle =
    bundleMode === 'full'
      ? 'Standard bundle for this class — pick Selected Sub-items if you want to customise quantities.'
      : 'Adjust quantities per type — you can increase or decrease as needed'

  return (
    <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
      <div className="mb-4 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary/10 p-2">
            <span className="material-symbols-outlined text-secondary" aria-hidden>library_books</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold md:text-xl">Notebooks</h3>
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end sm:gap-3 md:flex-col md:items-end">
          <StyledDropdown
            className="w-full min-w-0 sm:w-[12.75rem] md:w-[14rem]"
            value={bundleMode}
            onChange={handleModeChange}
            options={[
              { value: 'full', label: 'Full Bundle' },
              { value: 'subitems', label: 'Selected Sub-items' },
            ]}
          />
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Bundle Total</span>
            <span className="text-lg font-extrabold text-secondary tabular-nums">₹{bundleTotal}</span>
            {bundleMode === 'full' && bundleTotal < defaultTotal && defaultTotal > 0 && (
              <span className="text-[11px] text-on-surface-variant line-through">₹{defaultTotal}</span>
            )}
          </div>
        </div>
      </div>

      {bundleMode === 'full' && (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-4 md:px-5 md:py-5">
          <p className="text-sm font-semibold text-on-surface">Included in this bundle</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
            {subItems.map((sub) => {
              const qty = Number(sub.quantity ?? 0)
              const unitPrice = Number(sub.price ?? 33)
              const line = Math.ceil(unitPrice * qty)
              return (
                <li key={sub.id} className="marker:text-secondary">
                  <span className="font-medium text-on-surface">{sub.label}</span>
                  {' — '}
                  {qty} book{qty === 1 ? '' : 's'} at ₹{unitPrice}/book
                  <span className="tabular-nums text-on-surface-variant"> (₹{line})</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/10 pt-4 text-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-base text-secondary" aria-hidden>summarize</span>
              <span className="font-semibold text-on-surface">{defaultBookCount} notebooks</span>
              <span>in this bundle</span>
            </div>
            <span className="text-base font-extrabold text-secondary tabular-nums">₹{bundleTotal}</span>
          </div>
        </div>
      )}

      {bundleMode === 'subitems' && (
        <>
          <div className="mb-3 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2 text-[11px] text-on-surface-variant">
            <span className="font-semibold text-on-surface">Selected Sub-items:</span>{' '}
            total is ₹33 per book × quantity for each line (bundle package price does not apply in this mode).
          </div>
          <div className="mb-2 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="sr-only">Include</span>
            <span>Notebook Type</span>
            <span className="text-center">Default</span>
            <span className="w-24 text-center">Quantity</span>
            <span className="w-16 text-right">Total</span>
          </div>

          <div className="space-y-2">
            {subItems.map((sub) => {
              const defaultQty = Number(sub.quantity ?? 0)
              const currentQty = quantities[sub.id] ?? defaultQty
              const unitPrice = Number(sub.price ?? 33)
              const lineTotal = Math.ceil(unitPrice * currentQty)
              const enabled = currentQty > 0
              const isReduced = enabled && currentQty < defaultQty
              const isIncreased = enabled && currentQty > defaultQty

              return (
                <div
                  key={sub.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                    isReduced
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-600/40 dark:bg-amber-950/30'
                      : 'border-transparent bg-surface-container-lowest hover:border-outline-variant/10'
                  }`}
                >
                  <input
                    className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-secondary focus:ring-2 focus:ring-secondary"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onQuantityChange(sub.id, Math.max(1, Math.min(defaultQty, currentQty || defaultQty)))
                      } else {
                        onQuantityChange(sub.id, 0)
                      }
                    }}
                    aria-label={`Include ${sub.label}`}
                  />

                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                      <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden>description</span>
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-on-surface">{sub.label}</span>
                      <span className="text-[11px] text-on-surface-variant">₹{unitPrice}/book</span>
                    </div>
                    {isReduced && (
                      <span className="ml-1 shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Reduced
                      </span>
                    )}
                    {isIncreased && (
                      <span className="ml-1 shrink-0 rounded-full bg-sky-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                        Increased
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="rounded-lg bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant tabular-nums">
                      /{defaultQty}
                    </span>
                  </div>

                  <div className="flex w-24 items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(sub.id, Math.max(0, currentQty - 1))}
                      disabled={currentQty <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant/30 bg-white text-sm font-bold text-on-surface transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Decrease ${sub.label} quantity`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-on-surface">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(sub.id, currentQty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant/30 bg-white text-sm font-bold text-on-surface transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase ${sub.label} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <div className="w-16 text-right">
                    <span className={`text-sm font-bold tabular-nums ${isReduced ? 'text-amber-700' : 'text-on-surface'}`}>
                      ₹{lineTotal}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {subItems.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary" aria-hidden>summarize</span>
                <span className="text-xs font-semibold text-secondary">
                  {subItems.reduce((n, s) => n + (quantities[s.id] ?? s.quantity ?? 0), 0)} notebooks selected
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-base font-extrabold text-secondary tabular-nums">₹{bundleTotal}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
