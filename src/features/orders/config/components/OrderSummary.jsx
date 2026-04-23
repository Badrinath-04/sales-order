export default function OrderSummary({
  student,
  selectedClass,
  selectedSection,
  academic,
  uniform,
  uniformSubtotal,
  totalAmount,
  onConfirm,
}) {
  const classSection = `${selectedClass.id}-${selectedSection.id}`
  const textbookLabel =
    academic.textbookOption === 'All Subjects' ? 'Textbooks (All)' : `Textbooks (${academic.textbookOption})`
  const notebookShort =
    academic.notebookOption === '200 pages' ? '200pg' : academic.notebookOption.replace(' ', '')

  return (
    <div className="sticky top-28">
      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-8 flex items-start justify-between">
          <h3 className="font-headline text-2xl font-bold">Order Summary</h3>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Draft Order
          </div>
        </div>
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-container pb-4">
            <span className="text-sm text-on-surface-variant">Target Student</span>
            <span className="font-bold text-on-surface">
              {student.name} ({classSection})
            </span>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Current Selection
            </span>
            <div className="ml-1 space-y-1 border-l-2 border-primary/20 pl-1">
              <div className="mb-1 flex justify-between text-xs text-on-surface-variant">
                <span>Academic Kit Breakdown</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-on-surface">Mandatory Workbooks</span>
                <span className="font-medium">$120.00</span>
              </div>
              {academic.textbooks ? (
                <div className="flex justify-between text-[13px]">
                  <span className="text-on-surface">{textbookLabel}</span>
                  <span className="font-medium">$85.00</span>
                </div>
              ) : null}
              {academic.notebooks ? (
                <div className="flex justify-between text-[13px]">
                  <span className="text-on-surface">Notebooks ({notebookShort})</span>
                  <span className="font-medium">$25.00</span>
                </div>
              ) : null}
            </div>
            <div className="flex justify-between border-t border-surface-container/50 pt-2 text-sm">
              <span className="text-on-surface">Uniform (Selected Items)</span>
              <span className="font-semibold">${uniformSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface">Mandatory Insurance</span>
              <span className="font-semibold text-green-600">Free</span>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl bg-surface-container-low p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Configuration Notes
            </span>
            <p className="text-xs leading-relaxed text-on-surface">
              Shirt: <span className="font-semibold">M(38)</span>, Pant:{' '}
              <span className="font-semibold">{uniform.trousersWaist.replace(' Waist', '')}</span>, Notebooks:{' '}
              <span className="font-semibold">{notebookShort}</span>
              {uniform.includeKit && uniform.socks ? (
                <>
                  , Socks: <span className="font-semibold">{uniform.socksSize.split(' ')[0]}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <span className="text-lg font-semibold text-on-surface">Total Amount</span>
          <span className="text-3xl font-extrabold text-primary">${totalAmount.toFixed(2)}</span>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container py-5 text-lg font-bold text-on-primary shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
        >
          Confirm & Create Order
          <span className="material-symbols-outlined" data-icon="arrow_forward" aria-hidden>
            arrow_forward
          </span>
        </button>
        <p className="mt-6 px-4 text-center text-xs text-on-surface-variant">
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
