export default function UniformCategory({ categories, onSelect }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Category Selection
      </h4>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {categories.map((category) => {
          const isSelected = category.selected
          if (isSelected) {
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(category.id)}
                className="z-10 flex scale-105 flex-col items-center justify-center rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-2 ring-primary transition-all"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-3xl" data-icon={category.icon} aria-hidden>
                    {category.icon}
                  </span>
                </div>
                <span className="font-headline font-bold text-on-surface">{category.label}</span>
              </button>
            )
          }
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl" data-icon={category.icon} aria-hidden>
                  {category.icon}
                </span>
              </div>
              <span className="font-headline font-bold text-on-surface-variant">{category.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
