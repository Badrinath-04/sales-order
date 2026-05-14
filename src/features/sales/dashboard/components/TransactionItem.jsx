export default function TransactionItem({ transaction }) {
  const { title, meta, amount, icon, badgeText, badgeClassName } = transaction

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-5 transition-colors hover:bg-surface-container-low">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
          <span className="material-symbols-outlined text-outline" data-icon={icon} aria-hidden>
            {icon}
          </span>
        </div>
        <div>
          <h5 className="text-sm font-bold">{title}</h5>
          <p className="text-xs text-on-surface-variant">{meta}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="block text-sm font-bold">{amount}</span>
        <span className={badgeClassName}>{badgeText}</span>
      </div>
    </div>
  )
}
