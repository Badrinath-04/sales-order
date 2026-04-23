export default function ProceedButton({ onProceed }) {
  return (
    <button
      type="button"
      onClick={onProceed}
      className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-4 font-headline text-lg font-bold text-on-primary shadow-xl transition-all hover:scale-105 hover:shadow-primary/30 active:scale-95"
    >
      Proceed to Order
      <span
        className="material-symbols-outlined transition-transform group-hover:translate-x-1"
        data-icon="arrow_forward"
        aria-hidden
      >
        arrow_forward
      </span>
    </button>
  )
}
