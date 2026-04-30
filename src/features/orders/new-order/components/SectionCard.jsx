export default function SectionCard({ section, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(section)}
      className={`section-item group flex cursor-pointer items-center justify-between rounded-xl border border-primary/10 p-3 shadow-sm transition-all duration-200 ${
        isSelected ? 'bg-primary text-white' : 'bg-white hover:bg-primary hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            isSelected
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white'
          }`}
        >
          {section.section}
        </div>
        <div className="text-left">
          <h4 className="text-[13px] font-bold leading-tight">{section.name}</h4>
          <p className="text-[10px] opacity-70">{section.students} Students</p>
        </div>
      </div>
      <span
        className={`material-symbols-outlined text-sm transition-colors ${
          isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
        }`}
        data-icon="chevron_right"
        aria-hidden
      >
        chevron_right
      </span>
    </button>
  )
}
