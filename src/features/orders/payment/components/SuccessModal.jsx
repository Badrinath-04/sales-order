import { useEffect, useLayoutEffect, useRef } from 'react'

export default function SuccessModal({ open, onClose, onViewReceipt }) {
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const t = window.setTimeout(() => {
      onCloseRef.current()
    }, 2500)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="success-modal-check mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined text-4xl" data-icon="check" aria-hidden>
            check
          </span>
        </div>
        <h2
          id="success-modal-title"
          className="font-headline text-2xl font-extrabold tracking-tight text-on-surface"
        >
          Transaction Completed
        </h2>
        <p className="mt-2 text-on-surface-variant">Order placed successfully</p>
        <button
          type="button"
          onClick={onViewReceipt}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
        >
          View Receipt
        </button>
      </div>
    </div>
  )
}
