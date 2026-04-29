import { useEffect, useMemo } from 'react'

const BASE_METHODS = [
  { id: 'cash', label: 'Cash', sub: 'Pay at the school counter', icon: 'payments' },
  { id: 'canara_upi', label: 'Canara Bank UPI', sub: 'UPI to Canara account', icon: 'account_balance' },
  { id: 'upi_bharath', label: 'UPI to Bharath Kumar', sub: 'Direct UPI transfer', icon: 'qr_code_2' },
  { id: 'card', label: 'Card', sub: 'Credit or Debit card', icon: 'credit_card' },
  { id: 'credit', label: 'Credit', sub: 'Defer payment (ledger)', icon: 'receipt_long' },
  { id: 'other', label: 'Other', sub: 'Cheque or any other method', icon: 'more_horiz' },
]

export default function PaymentMethod({
  payment,
  onPaymentChange,
  finalPayable,
  branchName,
  remarks,
  onRemarksChange,
}) {
  const normalizedBranch = String(branchName ?? '').toLowerCase()
  const methods = useMemo(
    () => [
      ...BASE_METHODS,
      ...(normalizedBranch.includes('darga')
        ? [{ id: 'bob_upi', label: 'BOB UPI', sub: 'Only for Darga branch', icon: 'account_balance_wallet' }]
        : []),
      ...(normalizedBranch.includes('narsingi')
        ? [{ id: 'upi_poornima', label: 'UPI to Poornima', sub: 'Only for Narsingi branch', icon: 'qr_code_2' }]
        : []),
    ],
    [normalizedBranch],
  )

  const methodById = (id) => methods.find((m) => m.id === id)
  const firstMethod = payment.firstMethod
  const secondMethod = payment.secondMethod
  const enableSplit = Boolean(payment.enableSplit)
  const firstAmount = Number(payment.firstAmount || 0)
  const remaining = Math.max(0, Number(finalPayable || 0) - firstAmount)
  const hasSplit = Boolean(enableSplit && secondMethod)

  const update = (patch) => onPaymentChange({ ...payment, ...patch })

  useEffect(() => {
    if (!enableSplit || !firstMethod) return
    if (secondMethod && secondMethod !== firstMethod) return
    const next = methods.find((mm) => mm.id !== firstMethod)?.id
    if (!next || next === secondMethod) return
    onPaymentChange((prev) => ({ ...prev, secondMethod: next }))
  }, [enableSplit, firstMethod, secondMethod, methods, onPaymentChange])

  return (
    <div>
      <h2 className="mb-6 font-headline text-2xl font-extrabold tracking-tight">Select Payment Method</h2>
      <p className="mb-4 text-sm text-on-surface-variant">
        Final payable: <span className="font-bold text-primary">₹{Number(finalPayable || 0).toFixed(2)}</span>
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {methods.map((m) => (
          <label
            key={m.id}
            className={`group relative flex cursor-pointer flex-col rounded-xl border-2 bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md ${
              firstMethod === m.id ? 'border-primary bg-primary/5' : 'border-transparent'
            }`}
          >
            <input
              className="sr-only"
              name="first-payment"
              type="radio"
              checked={firstMethod === m.id}
              onChange={() => {
                const nextFirst = m.id
                let nextSecond = secondMethod
                if (enableSplit && nextSecond === nextFirst) {
                  nextSecond = methods.find((x) => x.id !== nextFirst)?.id || ''
                }
                update({ firstMethod: nextFirst, secondMethod: nextSecond })
              }}
            />
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <span className="material-symbols-outlined text-lg" data-icon={m.icon} aria-hidden>
                  {m.icon}
                </span>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  firstMethod === m.id ? 'border-primary bg-primary' : 'border-outline-variant'
                }`}
              >
                <div className={`h-2 w-2 rounded-full bg-white ${firstMethod === m.id ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
            <span className="text-sm font-bold">{m.label}</span>
            <span className="text-[11px] text-on-surface-variant">{m.sub}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-4 rounded-xl bg-surface-container-low p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableSplit}
            onChange={(e) => update({
              enableSplit: e.target.checked,
              secondMethod: e.target.checked ? (secondMethod || methods.find((m) => m.id !== firstMethod)?.id || '') : '',
              firstAmount: e.target.checked ? payment.firstAmount : String(Number(finalPayable || 0)),
            })}
            className="h-5 w-5 rounded-full border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm font-medium">Enable split payment</span>
        </label>

        {enableSplit && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Amount via {methodById(firstMethod)?.label ?? 'First Method'}</label>
                <input
                  type="number"
                  min={0}
                  max={Number(finalPayable || 0)}
                  step="0.01"
                  value={payment.firstAmount}
                  onChange={(e) => {
                    const raw = Number(e.target.value || 0)
                    const clamped = Math.min(Math.max(raw, 0), Number(finalPayable || 0))
                    update({ firstAmount: String(clamped) })
                  }}
                  placeholder={`Up to ₹${Number(finalPayable || 0).toFixed(2)}`}
                  title="Amount for the first payment method"
                  className="w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Remaining Amount</label>
                <div className="rounded-xl border border-outline-variant/20 bg-white px-3 py-2 text-sm font-bold text-primary">
                  ₹{remaining.toFixed(2)}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Second Method (auto receives remaining amount)</label>
              <select
                value={secondMethod}
                onChange={(e) => update({ secondMethod: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {methods.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === firstMethod}>
                    {m.label}{m.id === firstMethod ? ' (primary)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-on-surface-variant">
                {methodById(secondMethod)?.label ?? 'Second Method'}: ₹{remaining.toFixed(2)}
              </p>
            </div>
          </>
        )}
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
