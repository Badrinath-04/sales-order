import { useEffect, useLayoutEffect, useRef } from 'react'

export default function AdmissionSuccessModal({ open, onClose, onViewList, onNewAdmission }) {
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const t = window.setTimeout(() => onCloseRef.current(), 10000)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-success-modal-title"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="success-modal-check mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined text-4xl" aria-hidden>check</span>
        </div>
        <h2 id="admission-success-modal-title" className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          Payment Recorded
        </h2>
        <p className="mt-2 text-on-surface-variant">Admission marked as Paid successfully</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewList}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
          >
            Back to Admissions
          </button>
          <button
            type="button"
            onClick={onNewAdmission}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-4 font-bold text-on-surface transition-transform hover:bg-surface-container-low active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>person_add</span>
            New Admission
          </button>
        </div>
      </div>
    </div>
  )
}
