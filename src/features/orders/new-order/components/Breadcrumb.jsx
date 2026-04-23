export default function Breadcrumb({ selectedClass, selectedSection, onNavigate }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-xs font-medium text-neutral-400">
      <button
        type="button"
        onClick={() => onNavigate?.('orders')}
        className="transition-colors hover:text-primary"
      >
        Orders
      </button>
      <span className="material-symbols-outlined text-xs">chevron_right</span>
      <button
        type="button"
        onClick={() => onNavigate?.('new-selection')}
        className="transition-colors hover:text-primary"
      >
        New Selection
      </button>
      {selectedClass ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">{selectedClass.name}</span>
        </span>
      ) : null}
      {selectedClass && selectedSection ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">{selectedSection.name}</span>
        </span>
      ) : null}
    </nav>
  )
}
