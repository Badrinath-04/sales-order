export default function PaymentMethod({ value, onChange }) {
  return (
    <div>
      <h2 className="mb-6 font-headline text-2xl font-extrabold tracking-tight">Select Payment Method</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label
          className={`group relative flex cursor-pointer flex-col rounded-xl border-2 bg-surface-container-lowest p-6 shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md ${
            value === 'cash' ? 'border-primary bg-primary/5' : 'border-transparent'
          }`}
        >
          <input
            className="sr-only"
            name="payment"
            type="radio"
            checked={value === 'cash'}
            onChange={() => onChange('cash')}
          />
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <span className="material-symbols-outlined" data-icon="payments" aria-hidden>
                payments
              </span>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                value === 'cash' ? 'border-primary bg-primary' : 'border-outline-variant'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full bg-white ${value === 'cash' ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>
          <span className="text-lg font-bold">Cash</span>
          <span className="text-sm text-on-surface-variant">Pay at the school counter</span>
        </label>

        <label
          className={`group relative flex cursor-pointer flex-col rounded-xl border-2 bg-surface-container-lowest p-6 shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md ${
            value === 'online' ? 'border-primary bg-primary/5' : 'border-transparent'
          }`}
        >
          <input
            className="sr-only"
            name="payment"
            type="radio"
            checked={value === 'online'}
            onChange={() => onChange('online')}
          />
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <span className="material-symbols-outlined" data-icon="account_balance" aria-hidden>
                account_balance
              </span>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                value === 'online' ? 'border-primary bg-primary' : 'border-outline-variant'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full bg-white ${value === 'online' ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </div>
          <span className="text-lg font-bold">Online Payment</span>
          <span className="text-sm text-on-surface-variant">Credit, Debit, or UPI</span>
        </label>
      </div>
    </div>
  )
}
