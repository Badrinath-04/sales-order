/**
 * NotebooksSection
 *
 * Renders the Notebook Bundle for a class with per-variant quantity steppers.
 * Each notebook type (sub-item) shows:
 *   - Default quantity (from bundle definition)
 *   - Adjustable quantity (0 → default max)
 *   - Unit price (₹35)
 *   - Auto-calculated line total
 * A yellow badge appears when a variant is reduced below its bundle default.
 *
 * Props:
 *   notebookBundle   — BookKitItem with productType=SET, catalogKey="notebooks_bundle", subItems[]
 *   quantities       — { [subItemId]: number } — controlled quantity state from parent
 *   onQuantityChange — (subItemId, newQty) => void
 *   loading          — bool
 */

export default function NotebooksSection({ notebookBundle, quantities = {}, onQuantityChange, loading }) {
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
  const bundleTotal = subItems.reduce((sum, sub) => {
    const qty = quantities[sub.id] ?? sub.quantity ?? 0
    return sum + Math.ceil(Number(sub.price ?? 35) * qty)
  }, 0)
  const defaultTotal = Number(notebookBundle.setPrice ?? 0)

  return (
    <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between md:mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary/10 p-2">
            <span className="material-symbols-outlined text-secondary" aria-hidden>library_books</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold md:text-xl">Notebooks</h3>
            <p className="text-xs text-on-surface-variant">
              Adjust quantities per type — you can increase or decrease as needed
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Bundle Total</span>
          <span className="text-lg font-extrabold text-secondary tabular-nums">₹{bundleTotal}</span>
          {bundleTotal < defaultTotal && (
            <span className="text-[11px] text-on-surface-variant line-through">₹{defaultTotal}</span>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="mb-2 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span className="sr-only">Include</span>
        <span>Notebook Type</span>
        <span className="text-center">Default</span>
        <span className="text-center w-24">Quantity</span>
        <span className="text-right w-16">Total</span>
      </div>

      {/* Notebook rows */}
      <div className="space-y-2">
        {subItems.map((sub) => {
          const defaultQty = Number(sub.quantity ?? 0)
          const currentQty = quantities[sub.id] ?? defaultQty
          const unitPrice = Number(sub.price ?? 35)
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
              {/* Include checkbox */}
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

              {/* Label + badge */}
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

              {/* Default qty badge */}
              <div className="flex items-center justify-center">
                <span className="rounded-lg bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant tabular-nums">
                  /{defaultQty}
                </span>
              </div>

              {/* Quantity stepper */}
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

              {/* Line total */}
              <div className="w-16 text-right">
                <span className={`text-sm font-bold tabular-nums ${isReduced ? 'text-amber-700' : 'text-on-surface'}`}>
                  ₹{lineTotal}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bundle summary footer */}
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
    </div>
  )
}
