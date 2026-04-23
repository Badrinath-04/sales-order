import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Searchable list dropdown for future filters (e.g. students).
 * @param {{ value: string, label: string, subtitle?: string, image?: string }[]} options
 */
export default function SearchableDropdown({
  label,
  icon = 'search',
  options,
  value,
  onChange,
  menuKey,
  openMenu,
  setOpenMenu,
  searchPlaceholder = 'Search…',
}) {
  const ref = useRef(null)
  const isOpen = openMenu === menuKey
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [isOpen, setOpenMenu])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        String(o.value).toLowerCase().includes(q),
    )
  }, [options, query])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative min-w-0 max-w-xs" ref={ref}>
      {label ? (
        <span className="mb-1 block text-sm font-semibold text-on-surface-variant">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setOpenMenu(null)
          } else {
            setQuery('')
            setOpenMenu(menuKey)
          }
        }}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 ease-out ${
          isOpen
            ? 'border-2 border-primary'
            : 'border border-outline-variant/30 hover:border-primary'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <span
              className={`material-symbols-outlined shrink-0 ${isOpen ? 'text-primary' : 'text-on-surface-variant'}`}
              data-icon={icon}
              aria-hidden
            >
              {icon}
            </span>
          ) : null}
          <span className="truncate font-medium text-on-surface">{selected?.label ?? 'Select…'}</span>
        </div>
        <span
          className={`material-symbols-outlined shrink-0 ${isOpen ? 'text-primary' : 'text-on-surface-variant'}`}
          data-icon={isOpen ? 'expand_less' : 'expand_more'}
          aria-hidden
        >
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      <div
        className={`absolute left-0 right-0 top-full z-30 mt-1 origin-top transform overflow-hidden rounded-xl border border-outline-variant/20 bg-white shadow-[0_12px_32px_rgba(27,28,28,0.06)] transition-all duration-200 ease-out ${
          isOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="border-b border-outline-variant/20 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
            <span className="material-symbols-outlined text-lg text-on-surface-variant" data-icon="search" aria-hidden>
              search
            </span>
            <input
              className="w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filtered.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpenMenu(null)
                }}
                className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors hover:bg-surface-container-low ${
                  active ? 'border-primary bg-surface-container-low' : 'border-transparent'
                }`}
              >
                {opt.image ? (
                  <img src={opt.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs font-bold text-on-surface-variant">
                    {opt.label.slice(0, 1)}
                  </div>
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold text-on-surface">{opt.label}</span>
                  {opt.subtitle ? (
                    <span className="text-[10px] font-medium text-on-surface-variant">{opt.subtitle}</span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
