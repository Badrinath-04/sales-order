import { filterTabs } from '../../data'

export default function FilterBar({ searchQuery, onSearchChange, activeFilter, onFilterChange }) {
  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl bg-surface-container-low p-4 lg:flex-row">
      <div className="relative w-full lg:max-w-md">
        <span
          className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          data-icon="search"
          aria-hidden
        >
          search
        </span>
        <input
          className="w-full rounded-xl border-none bg-surface-container-lowest py-3 pl-12 pr-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/30"
          placeholder="Search student name or roll number"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="no-scrollbar flex w-full flex-wrap items-center gap-2 overflow-x-auto lg:w-auto">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={
                isActive
                  ? 'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-all active:scale-95'
                  : 'rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container-highest active:scale-95'
              }
            >
              {tab.label}
            </button>
          )
        })}
        <div className="mx-2 h-6 w-px bg-outline-variant" aria-hidden />
        <button
          type="button"
          className="rounded-xl bg-surface-container-lowest p-2.5 text-on-surface-variant transition-all hover:bg-surface-container-highest"
          aria-label="More filters"
        >
          <span className="material-symbols-outlined" data-icon="filter_list" aria-hidden>
            filter_list
          </span>
        </button>
      </div>
    </div>
  )
}
