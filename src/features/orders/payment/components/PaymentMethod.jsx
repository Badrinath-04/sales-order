const METHODS = [
  { id: 'cash',     label: 'Cash',      sub: 'Pay at the school counter',  icon: 'payments' },
  { id: 'gpay',     label: 'Google Pay', sub: 'UPI via Google Pay',         icon: 'phone_android' },
  { id: 'phonepe',  label: 'PhonePe',   sub: 'UPI via PhonePe',            icon: 'mobile_friendly' },
  { id: 'paytm',    label: 'Paytm',     sub: 'UPI via Paytm',              icon: 'account_balance_wallet' },
  { id: 'card',     label: 'Card',      sub: 'Credit or Debit card',       icon: 'credit_card' },
  { id: 'credit',   label: 'Credit',    sub: 'Defer payment (ledger)',      icon: 'receipt_long' },
  { id: 'online',   label: 'Online',    sub: 'Bank transfer / NEFT',        icon: 'account_balance' },
  { id: 'other',    label: 'Other',     sub: 'Cheque or any other method', icon: 'more_horiz' },
]

export default function PaymentMethod({ value, onChange, remarks, onRemarksChange }) {
  return (
    <div>
      <h2 className="mb-6 font-headline text-2xl font-extrabold tracking-tight">Select Payment Method</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {METHODS.map((m) => (
          <label
            key={m.id}
            className={`group relative flex cursor-pointer flex-col rounded-xl border-2 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md ${
              value === m.id ? 'border-primary bg-primary/5' : 'border-transparent'
            }`}
          >
            <input
              className="sr-only"
              name="payment"
              type="radio"
              checked={value === m.id}
              onChange={() => onChange(m.id)}
            />
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <span className="material-symbols-outlined text-lg" data-icon={m.icon} aria-hidden>
                  {m.icon}
                </span>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  value === m.id ? 'border-primary bg-primary' : 'border-outline-variant'
                }`}
              >
                <div className={`h-2 w-2 rounded-full bg-white ${value === m.id ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
            <span className="text-sm font-bold">{m.label}</span>
            <span className="text-[11px] text-on-surface-variant">{m.sub}</span>
          </label>
        ))}
      </div>

      <div className="mt-8">
        <label className="mb-2 block font-label text-sm font-semibold text-on-surface">
          Remarks <span className="font-normal text-on-surface-variant">(optional)</span>
        </label>
        <textarea
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="e.g. Partial payment of ₹150 done, Book misplaced — replacement issued, 10% discount applied…"
          className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface shadow-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="mt-1 text-right font-label text-[10px] text-on-surface-variant">
          {remarks.length}/200
        </p>
      </div>
    </div>
  )
}
