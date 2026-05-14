export default function InventoryCard({ item }) {
  const { label, summary, icon } = item

  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
        <span className="material-symbols-outlined" data-icon={icon} aria-hidden>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-on-surface-variant">{label}</p>
        <p className="text-sm font-bold">{summary}</p>
      </div>
    </div>
  )
}
