export default function ClassTile({ item, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`class-tile group relative cursor-pointer rounded-xl bg-surface-container-lowest p-4 transition-all duration-300 ${
        isSelected
          ? 'class-tile--selected border-2 border-primary ring-4 ring-primary/5'
          : 'border border-transparent hover:border-primary/20 hover:shadow-md'
      }`}
    >
      {isSelected ? (
        <div className="absolute right-1 top-1">
          <span
            className="material-symbols-outlined material-symbols-outlined--fill text-base text-primary"
            aria-hidden
          >
            check_circle
          </span>
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold transition-colors ${
            isSelected
              ? 'bg-primary text-white'
              : 'bg-surface-container-low text-primary group-hover:bg-primary group-hover:text-white'
          }`}
        >
          {item.shortLabel ?? item.id}
        </div>
        <div>
          <h3 className="font-headline text-sm font-bold leading-tight">{item.name}</h3>
          <p className="mt-0.5 text-[10px] text-neutral-400">{item.students} Students</p>
        </div>
      </div>
    </button>
  )
}
