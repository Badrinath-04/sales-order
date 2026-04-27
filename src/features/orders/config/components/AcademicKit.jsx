function productPrice(item, selection) {
  const isBundle = (item.productType ?? 'SET') === 'SET'
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

  return (
    <div className="rounded-3xl bg-surface-container-low p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <span className="material-symbols-outlined text-primary" data-icon="menu_book" aria-hidden>
              menu_book
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold">Academic Kit</h3>
        </div>
      </div>
      <div className="space-y-4">
        {kitItems.map((item) => {
          const selection = selections[item.id]
          if (!selection) return null
          const isBundle = (item.productType ?? 'SET') === 'SET'
          const selectedPrice = productPrice(item, selection)
          const subItems = item.subItems ?? []
          const variantOptions = item.variantOptions ?? subItems

          return (
            <div key={item.id} className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
              <div className="order-config-row flex w-full flex-col gap-4 md:flex-row md:items-center">
                <input
                  className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                  type="checkbox"
                  checked={selection.enabled}
                  onChange={(e) => setSelection(item.id, { enabled: e.target.checked })}
                />
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                    <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>
                      {item.icon ?? 'menu_book'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-on-surface">{item.label}</h4>
                    <p className="text-xs text-on-surface-variant">
                      {isBundle ? 'Bundle (full set or selected sub-items)' : 'Variant based selection'}
                    </p>
                  </div>
                </div>
                <div className="action-controls flex w-full items-center justify-end gap-3 md:ml-auto md:w-auto">
                  {selection.enabled && isBundle && (
                    <select
                      className="min-w-[160px] rounded-xl border-none bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                      value={selection.bundleMode}
                      onChange={(e) => setSelection(item.id, { bundleMode: e.target.value })}
                    >
                      <option value="full">Full Bundle</option>
                      <option value="subitems">Selected Sub-items</option>
                    </select>
                  )}
                  {selection.enabled && !isBundle && variantOptions.length > 0 && (
                    <select
                      className="min-w-[160px] rounded-xl border-none bg-surface-container-highest px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary"
                      value={selection.selectedVariantId ?? ''}
                      onChange={(e) => setSelection(item.id, { selectedVariantId: e.target.value })}
                    >
                      {variantOptions.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                      ))}
                    </select>
                  )}
                  <span className="min-w-[60px] text-right font-semibold text-on-surface">₹{selectedPrice.toFixed(2)}</span>
                </div>
              </div>
              {selection.enabled && isBundle && selection.bundleMode === 'subitems' && subItems.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 pl-8">
                  {subItems.map((sub) => {
                    const checked = selection.selectedSubItemIds?.includes(sub.id)
                    return (
                      <label key={sub.id} className="flex items-center gap-2 rounded-lg bg-surface-container p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const prev = selection.selectedSubItemIds ?? []
                            const selectedSubItemIds = e.target.checked
                              ? [...prev, sub.id]
                              : prev.filter((id) => id !== sub.id)
                            setSelection(item.id, { selectedSubItemIds })
                          }}
                        />
                        <span className="flex-1">{sub.label}</span>
                        <span className="font-semibold">₹{Number(sub.price).toFixed(2)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
