export default function ClassGrid({ classes, selectedClassId, onSelectClass }) {
  return (
    <div className="col-span-12 lg:col-span-7">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold">Select Class</h2>
        <span className="text-sm font-medium text-stone-500">
          {classes.length} Classes Found
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {classes.map((item) => {
          const isActive = item.id === selectedClassId
          if (isActive) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectClass(item.id)}
                className="relative flex aspect-square -translate-y-1 transform flex-col items-center justify-center gap-2 rounded-xl bg-primary shadow-lg ring-4 ring-primary-fixed transition-all"
              >
                <span className="text-xl font-black text-white">{item.shortLabel}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-primary-fixed">
                  {item.label}
                </span>
                {item.showEdit ? (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-tertiary text-white shadow-md">
                    <span className="material-symbols-outlined text-xs" aria-hidden>
                      edit
                    </span>
                  </div>
                ) : null}
              </button>
            )
          }
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectClass(item.id)}
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low transition-colors hover:bg-surface-container-highest"
            >
              <span className="text-xl font-black text-stone-300 transition-colors group-hover:text-stone-400">
                {item.shortLabel}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-stone-500">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
