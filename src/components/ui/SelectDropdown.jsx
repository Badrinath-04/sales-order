import { useEffect, useRef } from 'react'

/**
 * Single-select dropdown with optional section header (e.g. "Recent").
 * @param {{ value: string, label: string }[]} options
 */
export default function SelectDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  menuKey,
  openMenu,
  setOpenMenu,
  sectionLabel = 'Recent',
  showSection = true,
  compact = false,
}) {
  const ref = useRef(null)
  const isOpen = openMenu === menuKey

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

  const selected = options.find((o) => o.value === value) ?? options[0]

  return (
    <div className={`relative min-w-0 ${compact ? 'w-auto max-w-none' : 'max-w-xs'}`} ref={ref}>
      {label ? (
        <span className="mb-1 block text-sm font-semibold text-on-surface-variant">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => setOpenMenu(isOpen ? null : menuKey)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white text-left shadow-sm transition-all duration-200 ease-out ${
          compact ? 'min-w-[10rem] px-3 py-2.5 text-sm' : 'px-4 py-3'
        } ${
          isOpen
            ? 'border-2 border-primary'
            : 'border border-outline-variant/20 hover:border-primary'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`material-symbols-outlined shrink-0 text-sm ${isOpen ? 'text-primary' : compact ? 'text-on-surface-variant' : 'text-secondary'}`}
            data-icon={icon}
            aria-hidden
          >
            {icon}
          </span>
          <span className="truncate font-medium text-on-surface">{selected?.label}</span>
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
        className={`absolute left-0 right-0 top-full z-30 mt-1 origin-top transform rounded-xl border border-outline-variant/20 bg-white shadow-[0_12px_32px_rgba(27,28,28,0.06)] transition-all duration-200 ease-out ${
          isOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
        role="listbox"
      >
        <div className="p-2">
          {showSection && sectionLabel ? (
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant/60">
              {sectionLabel}
            </div>
          ) : null}
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value)
                  setOpenMenu(null)
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{opt.label}</span>
                {active ? (
                  <span className="material-symbols-outlined text-sm" data-icon="check" aria-hidden>
                    check
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
