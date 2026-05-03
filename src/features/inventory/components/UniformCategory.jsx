export default function UniformCategory({ categories, onSelect }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Category Selection
      </h4>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-4">
        {categories.map((category) => {
          const isSelected = category.selected
          if (isSelected) {
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(category.id)}
                className="z-10 flex scale-105 flex-col items-center justify-center rounded-2xl bg-surface-container-lowest p-3 shadow-sm ring-2 ring-primary transition-all md:p-6"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary md:mb-3 md:h-14 md:w-14">
                  <span className="material-symbols-outlined text-xl md:text-3xl" data-icon={category.icon} aria-hidden>
                    {category.icon}
                  </span>
                </div>
                <span className="font-headline text-xs font-bold text-on-surface md:text-base">{category.label}</span>
              </button>
            )
          }
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low p-3 transition-all hover:bg-surface-container-high md:p-6"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant md:mb-3 md:h-14 md:w-14">
                <span className="material-symbols-outlined text-xl md:text-3xl" data-icon={category.icon} aria-hidden>
                  {category.icon}
                </span>
              </div>
              <span className="font-headline text-xs font-bold text-on-surface-variant md:text-base">{category.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
