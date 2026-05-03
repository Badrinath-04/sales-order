import StyledDropdown from '@/components/ui/StyledDropdown'

function isBundleProduct(item) {
  return (item?.productType ?? 'BUNDLE') !== 'VARIANT'
}

function productPrice(item, selection) {
  const isBundle = isBundleProduct(item)
  if (isBundle) {
    if (selection.bundleMode === 'full') return Number(item.setPrice ?? item.price ?? 0)
    const subItems = item.subItems ?? []
    return subItems
      .filter((sub) => selection.selectedSubItemIds?.includes(sub.id))
      .reduce((sum, sub) => sum + Number(sub.price ?? 0), 0)
  }
  const variant = (item.variantOptions ?? item.subItems ?? []).find((sub) => sub.id === selection.selectedVariantId)
  return Number(variant?.price ?? item.price ?? 0)
}

export default function AcademicKit({ kitItems, selections, onChange }) {
  const setSelection = (itemId, patch) => {
    onChange((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? {}), ...patch } }))
  }

  const handleBundleModeChange = (item, selection, nextValue) => {
    if (nextValue !== 'subitems') {
      setSelection(item.id, { bundleMode: nextValue })
      return
    }
    const subItems = item.subItems ?? []
    const existingIds = Array.isArray(selection.selectedSubItemIds) ? selection.selectedSubItemIds : []
    setSelection(item.id, {
      bundleMode: nextValue,
      selectedSubItemIds: existingIds.length > 0 ? existingIds : subItems.map((sub) => sub.id),
    })
  }

  return (
    <div className="rounded-3xl bg-surface-container-low p-4 md:p-8">
      <div className="mb-4 flex items-center gap-3 md:mb-8">
        <div className="rounded-xl bg-primary/10 p-2">
          <span className="material-symbols-outlined text-primary" data-icon="menu_book" aria-hidden>
            menu_book
          </span>
        </div>
        <h3 className="font-headline text-lg font-bold md:text-xl">Academic Kit</h3>
      </div>
      <div className="space-y-3">
        {kitItems.map((item) => {
          const selection = selections[item.id]
          if (!selection) return null
          const isBundle = isBundleProduct(item)
          const selectedPrice = productPrice(item, selection)
          const subItems = item.subItems ?? []
          const variantOptions = item.variantOptions ?? subItems

          return (
            <div key={item.id} className="rounded-2xl border border-transparent bg-surface-container-lowest p-3 transition-all hover:border-outline-variant/10 md:p-5">
              {/* Header row: fixed-width dropdown + price so bundle mode change does not resize the row */}
              <div className="flex flex-nowrap items-center gap-2 md:gap-4">
                <input
                  className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                  type="checkbox"
                  checked={selection.enabled}
                  onChange={(e) => setSelection(item.id, { enabled: e.target.checked })}
                />
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container md:flex">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden>
                    {item.icon ?? 'menu_book'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden pr-1">
                  <h4 className="truncate text-sm font-semibold text-on-surface">{item.label}</h4>
                  <p className="line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
                    {isBundle ? 'Bundle (full set or selected sub-items)' : 'Variant'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 md:gap-3">
                  {selection.enabled && isBundle && (
                    <StyledDropdown
                      className="w-[11.5rem] shrink-0 sm:w-[12.75rem] md:w-[14rem]"
                      value={selection.bundleMode}
                      onChange={(nextValue) => handleBundleModeChange(item, selection, nextValue)}
                      options={[
                        { value: 'full', label: 'Full Bundle' },
                        { value: 'subitems', label: 'Selected Sub-items' },
                      ]}
                    />
                  )}
                  {selection.enabled && !isBundle && variantOptions.length > 0 && (
                    <StyledDropdown
                      className="w-[11.5rem] shrink-0 sm:w-[12.75rem] md:w-[14rem]"
                      value={selection.selectedVariantId ?? ''}
                      onChange={(nextValue) => setSelection(item.id, { selectedVariantId: nextValue })}
                      options={variantOptions.map((sub) => ({
                        value: sub.id,
                        label: sub.label,
                        priceLabel: `₹${Number(sub.price).toFixed(2)}`,
                      }))}
                    />
                  )}
                  <span className="w-[5.5rem] shrink-0 text-right text-sm font-bold tabular-nums text-on-surface">
                    ₹{selectedPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Sub-items panel */}
              {selection.enabled && isBundle && selection.bundleMode === 'subitems' && subItems.length > 0 && (
                <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-2.5">
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-1.5">
                    <span className="text-xs font-semibold text-on-surface">Full Bundle</span>
                    <span className="text-xs font-bold text-primary">₹{Number(item.setPrice ?? item.price ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="space-y-1">
                    {subItems.map((sub) => {
                      const checked = selection.selectedSubItemIds?.includes(sub.id)
                      const subQty = Number(sub.quantity ?? 0)
                      const availableStock = subQty > 0 ? subQty : Number(item.availableStock ?? 0)
                      const isOut = availableStock <= 0
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                            isOut
                              ? 'border-error/30 bg-error/5'
                              : 'border-outline-variant/20 bg-white hover:bg-primary/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            checked={checked}
                            onChange={(e) => {
                              const prev = selection.selectedSubItemIds ?? []
                              const selectedSubItemIds = e.target.checked
                                ? [...prev, sub.id]
                                : prev.filter((id) => id !== sub.id)
                              setSelection(item.id, { selectedSubItemIds })
                            }}
                          />
                          <span className={`min-w-0 flex-1 truncate text-xs font-medium ${isOut ? 'text-error' : 'text-on-surface'}`}>
                            {sub.label}
                          </span>
                          <span className={`shrink-0 text-[11px] ${isOut ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                            {isOut ? 'Out' : `${availableStock} left`}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-on-surface">₹{Number(sub.price).toFixed(2)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
