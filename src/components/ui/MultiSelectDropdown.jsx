import { useEffect, useRef, useState } from 'react'

/**
 * Multi-select with checkbox rows, counts, Clear all + Apply.
 * @param {{ value: string, label: string, count?: number }[]} options
 */
export default function MultiSelectDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  menuKey,
  openMenu,
  setOpenMenu,
  placeholderSummary = 'Payment Status',
  compact = false,
}) {
  const ref = useRef(null)
  const isOpen = openMenu === menuKey
  const [draft, setDraft] = useState(() => [...value])

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

  const toggleValue = (v) => {
    setDraft((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  }

  const displaySelection = isOpen ? draft : value
  const summary =
    displaySelection.length === 0
      ? placeholderSummary
      : displaySelection.length === options.length
        ? 'All statuses'
        : `${displaySelection.length} selected`

  return (
    <div className={`relative min-w-0 ${compact ? 'w-auto max-w-none' : 'max-w-xs'}`} ref={ref}>
      {label ? (
        <span className="mb-1 block text-sm font-semibold text-on-surface-variant">{label}</span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setOpenMenu(null)
          } else {
            setDraft([...value])
            setOpenMenu(menuKey)
          }
        }}
        className={`flex w-full items-center justify-between rounded-xl border bg-white text-left shadow-sm transition-all duration-200 ease-out ${
          compact ? 'min-w-[10rem] px-3 py-2.5 text-sm' : 'px-4 py-3'
        } ${
          isOpen
            ? 'border-2 border-primary'
            : 'border border-outline-variant/20 hover:border-primary'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`material-symbols-outlined shrink-0 text-sm ${isOpen ? 'text-primary' : compact ? 'text-on-surface-variant' : 'text-secondary'}`}
            data-icon={icon}
            aria-hidden
          >
            {icon}
          </span>
          <span className="truncate font-medium text-on-surface">{summary}</span>
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
        <div className="flex flex-col gap-3 p-4">
          {options.map((opt) => {
            const checked = draft.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleValue(opt.value)}
                className="flex w-full cursor-pointer items-center gap-3 text-left"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    checked ? 'border-primary bg-primary' : 'border-outline-variant hover:border-primary'
                  }`}
                >
                  {checked ? (
                    <span className="material-symbols-outlined text-xs text-white" data-icon="check" aria-hidden>
                      check
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-medium text-on-surface">{opt.label}</span>
                {opt.count != null ? (
                  <span className="ml-auto rounded-full bg-surface-container-highest px-2 py-0.5 text-xs text-on-surface-variant">
                    {opt.count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between border-t border-outline-variant/20 bg-surface-container-lowest p-3">
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline"
            onClick={() => setDraft([])}
          >
            Clear All
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
            onClick={() => {
              onChange(draft)
              setOpenMenu(null)
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
