import StyledDropdown from '@/components/ui/StyledDropdown'

function optionLabel(option) {
  return {
    label: option.label,
    priceLabel: `₹${Number(option.price ?? 0).toFixed(2)}`,
  }
}

export default function UniformConfig({ value, onChange, catalog = {} }) {
  const setField = (patch) => onChange({ ...value, ...patch })
  const shirts = catalog.shirt ?? []
  const trousers = catalog.trousers ?? []
  const socks = catalog.socks ?? []

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
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-2 ring-primary/20 transition-all">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <input
                className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                type="checkbox"
                checked={value.shirt}
                onChange={(e) => setField({ shirt: e.target.checked })}
                disabled={shirts.length === 0}
              />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <span className="material-symbols-outlined text-primary" data-icon="checkroom" aria-hidden>
                  checkroom
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-on-surface">Shirt</h4>
                <p className="text-xs text-on-surface-variant">
                  {shirts.length > 0 ? `${shirts.length} size options available` : 'No shirt sizes configured'}
                </p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <StyledDropdown
                className="min-w-[170px]"
                value={value.selectedShirtSizeId ?? ''}
                onChange={(nextValue) => setField({ selectedShirtSizeId: nextValue })}
                disabled={!value.shirt || shirts.length === 0}
                options={shirts.map((opt) => ({ value: opt.id, ...optionLabel(opt) }))}
              />
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <input
                className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                type="checkbox"
                checked={value.trousers}
                onChange={(e) => setField({ trousers: e.target.checked })}
                disabled={trousers.length === 0}
              />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="dry_cleaning" aria-hidden>
                  dry_cleaning
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-on-surface">Trousers</h4>
                <p className="text-xs text-on-surface-variant">
                  {trousers.length > 0 ? `${trousers.length} size options available` : 'No trouser sizes configured'}
                </p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <StyledDropdown
                className="min-w-[170px]"
                value={value.selectedTrouserSizeId ?? ''}
                onChange={(nextValue) => setField({ selectedTrouserSizeId: nextValue })}
                disabled={!value.trousers || trousers.length === 0}
                options={trousers.map((opt) => ({ value: opt.id, ...optionLabel(opt) }))}
              />
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <input
                className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                type="checkbox"
                checked={value.socks}
                onChange={(e) => setField({ socks: e.target.checked })}
                disabled={socks.length === 0}
              />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="footprint" aria-hidden>
                  footprint
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-on-surface">Socks</h4>
                <p className="text-xs text-on-surface-variant">
                  {socks.length > 0 ? `${socks.length} size options available` : 'No socks sizes configured'}
                </p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <StyledDropdown
                className="min-w-[170px]"
                value={value.selectedSocksSizeId ?? ''}
                onChange={(nextValue) => setField({ selectedSocksSizeId: nextValue })}
                disabled={!value.socks || socks.length === 0}
                options={socks.map((opt) => ({ value: opt.id, ...optionLabel(opt) }))}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
