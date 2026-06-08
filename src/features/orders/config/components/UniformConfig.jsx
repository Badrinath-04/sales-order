import StyledDropdown from '@/components/ui/StyledDropdown'

function optionLabel(option) {
  return {
    label: option.label,
    priceLabel: `₹${Number(option.price ?? 0).toFixed(2)}`,
  }
}

function optionSummary(options) {
  if (!options.length) return 'No stock variants configured'
  if (options.length === 1 && options[0]?.code === 'ONE') return 'Universal size'
  return `${options.length} size options available`
}

export default function UniformConfig({ value, onChange, catalog = {} }) {
  const categories = catalog.categories ?? []
  const selections = value.selections ?? {}
  const setSelection = (key, patch) => {
    onChange({
      ...value,
      selections: {
        ...selections,
        [key]: {
          ...(selections[key] ?? {}),
          ...patch,
        },
      },
    })
  }
  const setQuantity = (key, nextQuantity, maxStock) => {
    const safeMax = Math.max(1, Number(maxStock ?? 1))
    const safeQty = Math.min(safeMax, Math.max(1, Math.floor(Number(nextQuantity) || 1)))
    setSelection(key, { quantity: safeQty })
  }

  return (
    <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
      <div className="mb-4 flex items-center gap-3 md:mb-8">
        <div className="rounded-xl bg-primary/10 p-2">
          <span className="material-symbols-outlined text-primary" data-icon="apparel" aria-hidden>
            apparel
          </span>
        </div>
        <h3 className="font-headline text-xl font-bold">Uniform Configuration</h3>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const selected = selections[category.key] ?? {}
          const enabled = Boolean(selected.enabled)
          const selectedSizeId = selected.selectedSizeId ?? category.options[0]?.id ?? ''
          const hasOptions = category.options.length > 0
          const isUniversal = category.options.length === 1 && category.options[0]?.code === 'ONE'
          const selectedOption = category.options.find((opt) => opt.id === selectedSizeId) ?? category.options[0]
          const quantity = Math.max(1, Math.floor(Number(selected.quantity ?? 1)))
          const maxStock = Math.max(1, Number(selectedOption?.stock ?? 1))

          return (
            <div
              key={category.key}
              className={`rounded-2xl border p-5 transition-all ${
                enabled
                  ? 'border-transparent bg-white shadow-sm ring-2 ring-primary/20'
                  : 'border-transparent bg-surface-container-lowest hover:border-outline-variant/10'
              }`}
            >
              <label className="order-config-row flex w-full cursor-pointer flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSelection(category.key, {
                      enabled: e.target.checked,
                      selectedSizeId,
                      quantity,
                    })}
                    disabled={!hasOptions}
                  />
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${enabled ? 'bg-primary/5' : 'bg-surface-container'}`}>
                    <span
                      className={`material-symbols-outlined ${enabled ? 'text-primary' : 'text-on-surface-variant'}`}
                      data-icon={category.icon}
                      aria-hidden
                    >
                      {category.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-on-surface">{category.label}</h4>
                    <p className="text-xs text-on-surface-variant">
                      {optionSummary(category.options)}
                    </p>
                  </div>
                </div>
                <div className="action-controls flex w-full flex-col gap-3 transition-all duration-300 md:ml-auto md:w-auto md:flex-row md:items-center md:justify-end">
                  {isUniversal ? (
                    <span className="min-w-[180px] rounded-xl bg-primary/5 px-3 py-2 text-center text-sm font-bold text-primary">
                      {category.options[0]?.label ?? 'One Size'} - ₹{Number(category.options[0]?.price ?? 0).toFixed(2)}
                    </span>
                  ) : (
                    <StyledDropdown
                      className="min-w-[170px]"
                      value={selectedSizeId}
                      onChange={(nextValue) => {
                        const nextOption = category.options.find((opt) => opt.id === nextValue)
                        setSelection(category.key, {
                          selectedSizeId: nextValue,
                          quantity: Math.min(quantity, Math.max(1, Number(nextOption?.stock ?? 1))),
                        })
                      }}
                      disabled={!enabled || !hasOptions}
                      options={category.options.map((opt) => ({ value: opt.id, ...optionLabel(opt) }))}
                    />
                  )}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={!enabled || quantity <= 1}
                      onClick={() => setQuantity(category.key, quantity - 1, maxStock)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-white text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Decrease ${category.label} quantity`}
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden>remove</span>
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxStock}
                      disabled={!enabled}
                      value={quantity}
                      onChange={(e) => setQuantity(category.key, e.target.value, maxStock)}
                      className="h-9 w-14 rounded-lg border border-outline-variant/30 bg-white text-center text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`${category.label} quantity`}
                    />
                    <button
                      type="button"
                      disabled={!enabled || quantity >= maxStock}
                      onClick={() => setQuantity(category.key, quantity + 1, maxStock)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-white text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase ${category.label} quantity`}
                    >
                      <span className="material-symbols-outlined text-base" aria-hidden>add</span>
                    </button>
                  </div>
                </div>
              </label>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="rounded-2xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
            No uniform products configured.
          </div>
        )}
      </div>
    </div>
  )
}
