function ClassTile({ item, isActive, onSelect, compact }) {
  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={
          compact
            ? 'relative flex h-[5.25rem] w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-primary shadow-lg ring-2 ring-primary-fixed transition-all'
            : 'relative flex aspect-square -translate-y-1 transform flex-col items-center justify-center gap-2 rounded-xl bg-primary shadow-lg ring-4 ring-primary-fixed transition-all'
        }
      >
        <span className={compact ? 'text-lg font-black text-white' : 'text-xl font-black text-white'}>{item.shortLabel}</span>
        <span
          className={
            compact
              ? 'max-w-[5rem] truncate px-0.5 text-[9px] font-bold uppercase tracking-tighter text-primary-fixed'
              : 'text-[10px] font-bold uppercase tracking-tighter text-primary-fixed'
          }
        >
          {item.label}
        </span>
        {item.showEdit ? (
          <div
            className={`absolute flex items-center justify-center rounded-full bg-tertiary text-white shadow-md ${
              compact ? '-right-1.5 -top-1.5 h-5 w-5' : '-right-2 -top-2 h-6 w-6'
            }`}
          >
            <span className={`material-symbols-outlined text-white ${compact ? 'text-[10px]' : 'text-xs'}`} aria-hidden>
              edit
            </span>
          </div>
        ) : null}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={
        compact
          ? 'flex h-[5.25rem] w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-low transition-colors hover:bg-surface-container-highest active:bg-surface-container-high'
          : 'group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low transition-colors hover:bg-surface-container-highest'
      }
    >
      <span
        className={
          compact
            ? 'text-lg font-black text-stone-300'
            : 'text-xl font-black text-stone-300 transition-colors group-hover:text-stone-400'
        }
      >
        {item.shortLabel}
      </span>
      <span
        className={
          compact
            ? 'max-w-[5rem] truncate px-0.5 text-[9px] font-bold uppercase tracking-tighter text-stone-500'
            : 'text-[10px] font-bold uppercase tracking-tighter text-stone-500'
        }
      >
        {item.label}
      </span>
    </button>
  )
}

export default function ClassGrid({ classes, selectedClassId, onSelectClass }) {
  return (
    <div className="col-span-1 w-full min-w-0 lg:col-span-7">
      <div className="mb-3 flex w-full min-w-0 items-center justify-between gap-2">
        <h2 className="font-headline min-w-0 truncate text-lg font-bold lg:text-xl">Select Class</h2>
        <span className="shrink-0 text-xs font-medium text-stone-500">{classes.length} Classes Found</span>
      </div>

      <div className="flex w-full min-w-0 flex-wrap gap-2.5 lg:hidden">
        {classes.map((item) => (
          <ClassTile
            key={item.id}
            item={item}
            isActive={item.id === selectedClassId}
            onSelect={onSelectClass}
            compact
          />
        ))}
      </div>

      <div className="hidden grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid">
        {classes.map((item) => (
          <ClassTile
            key={item.id}
            item={item}
            isActive={item.id === selectedClassId}
            onSelect={onSelectClass}
            compact={false}
          />
        ))}
      </div>
    </div>
  )
}
