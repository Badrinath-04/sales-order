const snapshots = [
  { id: 'tx', label: 'Textbooks', count: '1,240 In Stock', icon: 'auto_stories' },
  { id: 'un', label: 'Uniforms', count: '482 In Stock', icon: 'checkroom' },
  { id: 'st', label: 'Stationery', count: '2.1k In Stock', icon: 'edit_note' },
  { id: 'dv', label: 'Devices', count: '15 In Stock', icon: 'laptop_mac' },
]

export default function InventorySnapshot() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {snapshots.map((snap) => (
        <div key={snap.id} className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
            <span className="material-symbols-outlined" data-icon={snap.icon} aria-hidden>
              {snap.icon}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">{snap.label}</p>
            <p className="text-sm font-bold text-on-surface">{snap.count}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
