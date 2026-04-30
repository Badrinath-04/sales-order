const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCjP8LSuLGsU8SVSHrtl-ckdinFH-WjeRRE1BmUjYu9WQUzDft2_2kdfXfRr01Ic3fS413-dgfru9O8_P00NgfPhIKBr5z7x23kh6z61Yb-Mbfr-h6BN00A2Pp-rD1JGfisdYEvsvY8NNekVwUKW74C0Y112CHvuvttCsAqR3RYSSaLMGV2zemtR677Ps0erTsPcCjeZu4P7zkqTHpJpBeINzKgXURO2Wys2n8pe4y2NmvycBBuzgByGrXpbbhsMf6LDoi-AZlQ7XI'

export default function OrderSummary({
  student,
  selectedClass,
  selectedSection,
  orderDetails,
  orderNotes,
  onOrderNotesChange,
  noteTemplateGroups = [],
  showQuickNoteTemplates = false,
  onToggleQuickNoteTemplates,
  discountAmount,
  onDiscountAmountChange,
  finalPayable,
  paidNow = 0,
  remainingDue = 0,
  paymentEntries = [],
  onComplete,
  onEdit,
  submitting,
  orderCompleted,
  isDueSettlement = false,
}) {
  const avatarSrc = student.avatarUrl ?? DEFAULT_AVATAR

  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-28">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-8">
          <h2 className="mb-5 flex items-center gap-2 font-headline text-lg font-extrabold tracking-tight md:mb-6 md:text-xl">
            <span className="material-symbols-outlined text-primary" data-icon="shopping_basket" aria-hidden>
              shopping_basket
            </span>
            Order Summary
          </h2>
          <div className="mb-6 rounded-lg bg-surface-container-low p-4 md:mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
                <img className="h-full w-full object-cover" alt={student.name} src={avatarSrc} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{student.name}</h3>
                <p className="text-sm text-on-surface-variant">
                  {selectedClass.name} • {selectedSection.name}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-5 md:space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Book Kit
                </span>
                {onEdit && (
                  <button type="button" onClick={onEdit} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {orderDetails.bookKit.map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-medium">₹{row.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-surface-container-high" />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Uniform Kit
                </span>
                {onEdit && (
                  <button type="button" onClick={onEdit} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {orderDetails.uniformKit.length ? (
                  orderDetails.uniformKit.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{row.label}</span>
                      <span className="font-medium">₹{row.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">No uniform items in this order.</p>
                )}
              </div>
            </div>
            <div className="h-[2px] rounded-full bg-primary/20" />
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-medium">₹{orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-surface-container-high pt-5 md:mt-6 md:pt-6">
                <span className="text-lg font-extrabold md:text-xl">Total Amount</span>
                <span className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">
                  ₹{orderDetails.total.toFixed(2)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-on-surface-variant">Discount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => onDiscountAmountChange?.(e.target.value)}
                  disabled={isDueSettlement}
                  placeholder="0.00"
                  title="Discount amount in rupees"
                  className="w-32 rounded-lg border border-outline-variant/30 bg-white px-2 py-1 text-right text-sm font-semibold placeholder:text-on-surface-variant/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-surface-container-high pt-3">
                <span className="text-lg font-bold">Final Payable</span>
                <span className="text-2xl font-extrabold text-primary">₹{Number(finalPayable ?? 0).toFixed(2)}</span>
              </div>
              <div className="mt-3 rounded-xl bg-surface-container-low p-3 text-xs">
                <p className="mb-1 font-bold uppercase tracking-wide text-on-surface-variant">Payment Summary</p>
                <div className="flex items-center justify-between">
                  <span>Paid Now</span>
                  <span className="font-semibold">₹{Number(paidNow ?? 0).toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Remaining Due</span>
                  <span className="font-semibold text-error">₹{Number(remainingDue ?? 0).toFixed(2)}</span>
                </div>
              </div>
              {paymentEntries.length > 0 && (
                <div className="mt-3 rounded-xl bg-surface-container-low p-3 text-xs">
                  <p className="mb-1 font-bold uppercase tracking-wide text-on-surface-variant">Payment Split</p>
                  {paymentEntries.map((entry) => (
                    <div key={`${entry.method}-${entry.amount}`} className="flex items-center justify-between gap-3">
                      <span>{String(entry.method).toUpperCase()}</span>
                      <span className="font-semibold">₹{Number(entry.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-stone-400" htmlFor="order-notes">
              Notes (optional)
            </label>
            {noteTemplateGroups.length > 0 && (
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={showQuickNoteTemplates}
                  onChange={(e) => onToggleQuickNoteTemplates?.(e.target.checked)}
                  className="h-5 w-5 rounded-full border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
                />
                Show quick note templates
              </label>
            )}
            {showQuickNoteTemplates && noteTemplateGroups.length > 0 && (
              <div className="mb-2 space-y-2">
                {noteTemplateGroups.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{group.group}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => onOrderNotesChange?.(template.slice(0, 300))}
                          className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                          title={template}
                        >
                          {template.length > 44 ? `${template.slice(0, 44)}…` : template}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onOrderNotesChange?.('')}
                  className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Custom Note
                </button>
              </div>
            )}
            <div className="relative">
              <textarea
                id="order-notes"
                value={orderNotes ?? ''}
                onChange={(e) => onOrderNotesChange?.(e.target.value.slice(0, 300))}
                maxLength={300}
                rows={3}
                placeholder="e.g. English textbook not given — out of stock, student to collect later"
                className="w-full resize-none rounded-xl border border-outline-variant/30 bg-white px-4 py-3 pb-7 text-sm text-on-surface shadow-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-on-surface-variant">
                {(orderNotes ?? '').length}/300
              </p>
            </div>
          </div>
          <div className="mt-8">
            <button
              type="button"
              onClick={onComplete}
              disabled={submitting || orderCompleted}
              className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-5 text-lg font-extrabold text-white shadow-xl shadow-primary/20 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Processing…' : orderCompleted ? 'Order Submitted' : (isDueSettlement ? 'Clear Due & Complete Payment' : 'Confirm & Create Order')}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm" data-icon="lock" aria-hidden>
                lock
              </span>
              Secure encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
