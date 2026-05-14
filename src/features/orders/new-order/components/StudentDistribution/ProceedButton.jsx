export default function ProceedButton({ onProceed, studentName }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 md:justify-center">
      {studentName && (
        <div className="min-w-0 flex-1 md:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Selected</p>
          <p className="truncate text-sm font-bold text-on-surface">{studentName}</p>
        </div>
      )}
      <button
        type="button"
        onClick={onProceed}
        className="group flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-on-primary shadow-lg transition-all active:scale-95 hover:opacity-90 md:gap-3 md:rounded-full md:px-8 md:py-3 md:text-base"
      >
        Proceed to Order
        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1" aria-hidden>
          arrow_forward
        </span>
      </button>
    </div>
  )
}
