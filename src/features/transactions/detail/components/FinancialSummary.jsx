function formatMoney(n) {
  return `₹${Number(n).toFixed(2)}`
}

export default function FinancialSummary({ financial }) {
  const statusLabel =
    financial.paymentStatus === 'PAID'
      ? 'Fully Paid'
      : financial.paymentStatus === 'PARTIAL'
        ? 'Partial / Due'
        : 'Credit'

  return (
    <section className="rounded-xl bg-surface-container-lowest p-6 shadow-md ring-1 ring-on-surface/5">
      <h3 className="mb-6 font-headline text-lg font-bold text-on-surface">Financial Summary</h3>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="font-medium text-on-surface">{formatMoney(financial.subtotal)}</span>
        </div>
        <div className="flex items-end justify-between border-t border-surface-variant pt-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Amount</p>
            <p className="font-headline text-3xl font-extrabold text-primary">{formatMoney(financial.total)}</p>
          </div>
          <span className="mb-2 rounded bg-secondary-fixed px-2 py-1 font-label text-[10px] font-black uppercase tracking-tighter text-on-secondary-fixed">
            INR
          </span>
        </div>
      </div>
      <div className="space-y-3 rounded-xl bg-surface-container-low p-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-primary" data-icon="credit_card" aria-hidden>
            credit_card
          </span>
          <div>
            <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Payment Methods</p>
            <p className="text-sm font-semibold text-on-surface">{financial.paymentMode}</p>
          </div>
        </div>
        <div>
          <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Status</p>
          <p className="text-sm font-semibold text-on-surface">{statusLabel}</p>
        </div>
        <div>
          <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Reference ID</p>
          <p className="mt-1 overflow-hidden text-ellipsis rounded bg-white/50 px-2 py-1 font-mono text-xs text-on-surface">
            {financial.referenceId}
          </p>
        </div>
        <div>
          <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Timestamp</p>
          <p className="text-sm font-semibold text-on-surface">{financial.paidTimestamp}</p>
        </div>
      </div>
    </section>
  )
}
