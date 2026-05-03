export default function OrderSummary({
  student,
  selectedClass,
  selectedSection,
  selectedBookItems,
  uniform,
  uniformCatalog,
  uniformSubtotal,
  totalAmount,
  onConfirm,
}) {
  const classSection = [
    selectedClass.label ?? selectedClass.name ?? selectedClass.grade,
    selectedSection.label ?? selectedSection.name ?? selectedSection.section,
  ].filter(Boolean).join(' › ')
  const shirt = (uniformCatalog?.shirt ?? []).find((s) => s.id === uniform.selectedShirtSizeId)
  const trouser = (uniformCatalog?.trousers ?? []).find((s) => s.id === uniform.selectedTrouserSizeId)
  const socks = (uniformCatalog?.socks ?? []).find((s) => s.id === uniform.selectedSocksSizeId)
  const uniformItems = []
  if (uniform.includeKit) {
    if (uniform.shirt && shirt) {
      uniformItems.push({ label: `Shirt - ${shirt.label}`, unitPrice: Number(shirt.price ?? 0) })
    }
    if (uniform.trousers && trouser) {
      uniformItems.push({ label: `Trousers - ${trouser.label}`, unitPrice: Number(trouser.price ?? 0) })
    }
    if (uniform.socks && socks) {
      uniformItems.push({ label: `Socks - ${socks.label}`, unitPrice: Number(socks.price ?? 0) })
    }
  }

  return (
    <div className="sticky top-28">
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-8">
        <div className="mb-5 flex items-start justify-between md:mb-8">
          <h3 className="font-headline text-xl font-bold md:text-2xl">Order Summary</h3>
          <div className="rounded-full border border-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 md:px-3 md:py-1">
            Draft Order
          </div>
        </div>
        <div className="mb-5 space-y-4 md:mb-8 md:space-y-6">
          <div className="flex flex-col gap-1 border-b border-surface-container pb-4 md:flex-row md:items-center md:justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant md:text-sm">Target Student</span>
            <span className="min-w-0 text-sm font-bold leading-tight text-on-surface md:text-right md:text-base">
              {student.name}
              {classSection && <span className="block text-xs font-normal text-on-surface-variant md:inline md:ml-1 md:text-sm">({classSection})</span>}
            </span>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Current Selection
            </span>
            <div className="ml-1 space-y-1 border-l-2 border-primary/20 pl-1">
              <div className="mb-1 flex justify-between text-xs font-semibold tracking-wide text-primary">
                <span>Academic Kit Breakdown</span>
              </div>
              {selectedBookItems.map((item, idx) => (
                <div key={`${item.itemId}-${idx}`} className="flex justify-between text-[13px]">
                  <span className="text-on-surface">{item.label}</span>
                  <span className="font-medium">₹{Number(item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
              {selectedBookItems.length === 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-on-surface-variant">No academic items selected</span>
                  <span className="font-medium">₹0.00</span>
                </div>
              )}
            </div>
            <div className="ml-1 space-y-1 border-l-2 border-primary/20 pl-1">
              <div className="mb-1 flex justify-between text-xs font-semibold tracking-wide text-primary">
                <span>Uniform Kit Breakdown</span>
              </div>
              {uniformItems.map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="flex justify-between text-[13px]">
                  <span className="text-on-surface">{item.label}</span>
                  <span className="font-medium">₹{Number(item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
              {uniformItems.length === 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-on-surface-variant">No uniform items selected</span>
                  <span className="font-medium">₹0.00</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-surface-container/50 pt-2 text-sm">
              <span className="text-on-surface">Uniform (Selected Items)</span>
              <span className="font-semibold">₹{uniformSubtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="mb-5 flex items-center justify-between md:mb-8">
          <span className="text-base font-semibold text-on-surface md:text-lg">Total Amount</span>
          <span className="text-2xl font-extrabold text-primary md:text-3xl">₹{totalAmount.toFixed(2)}</span>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-container py-4 text-base font-bold text-on-primary shadow-lg shadow-primary/30 transition-transform active:scale-[0.98] md:gap-3 md:py-5 md:text-lg"
        >
          Proceed to Payment
          <span className="material-symbols-outlined" data-icon="arrow_forward" aria-hidden>
            arrow_forward
          </span>
        </button>
        <p className="mt-4 px-2 text-center text-xs text-on-surface-variant md:mt-6 md:px-4">
          By confirming, inventory will be locked for {student.name} ({student.roll}).
        </p>
      </div>
      <div className="mt-6 flex gap-4 rounded-3xl border border-tertiary/20 bg-tertiary/10 p-6">
        <span className="material-symbols-outlined text-tertiary" data-icon="info" aria-hidden>
          info
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-tertiary">Automated Selection</p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
            Academic kit components and uniform sizes were pre-filled based on past records.
          </p>
        </div>
      </div>
    </div>
  )
}
