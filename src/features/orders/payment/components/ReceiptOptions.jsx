import { useState } from 'react'

export default function ReceiptOptions({ onPrint }) {
  const [digitalReceipt, setDigitalReceipt] = useState('')

  return (
    <div className="space-y-6 rounded-xl bg-surface-container-low p-8">
      <h2 className="font-headline text-xl font-extrabold tracking-tight">Receipt Options</h2>
      <div className="space-y-4">
        <div className="relative">
          <label className="mb-1 block px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Email or Phone for Digital Receipt
          </label>
          <input
            className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 transition-all focus:bg-surface-container-lowest focus:ring-0 placeholder:text-on-surface-variant/50"
            placeholder="e.g. parent@school.com or 9876543210"
            type="text"
            value={digitalReceipt}
            onChange={(e) => setDigitalReceipt(e.target.value)}
            autoComplete="off"
          />
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300" />
        </div>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onPrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-4 font-bold text-on-primary-container shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" data-icon="receipt_long" aria-hidden>
              receipt_long
            </span>
            Print Receipt
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-4 font-bold text-on-primary shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" data-icon="send" aria-hidden>
              send
            </span>
            Send Digital Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
