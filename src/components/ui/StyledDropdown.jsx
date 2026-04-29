import { useEffect, useMemo, useRef, useState } from 'react'

export default function StyledDropdown({ value, options, onChange, className = '', disabled = false }) {
  const [open, setOpen] = useState(false)
  const instanceIdRef = useRef(`dropdown-${Math.random().toString(36).slice(2)}`)
  const instanceId = instanceIdRef.current
  const selected = useMemo(() => options.find((o) => o.value === value) ?? options[0], [options, value])
  const selectedLabel = selected?.priceLabel
    ? `${selected.label} - ${selected.priceLabel}`
    : (selected?.label ?? 'Select')

  useEffect(() => {
    const onDropdownOpen = (evt) => {
      if (evt?.detail?.id !== instanceId) setOpen(false)
    }
    window.addEventListener('skm-dropdown-opened', onDropdownOpen)
    return () => window.removeEventListener('skm-dropdown-opened', onDropdownOpen)
  }, [instanceId])

  const toggleOpen = () => {
    if (disabled) return
    setOpen((prev) => {
      const next = !prev
      if (next) {
        window.dispatchEvent(new CustomEvent('skm-dropdown-opened', { detail: { id: instanceId } }))
      }
      return next
    })
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-highest px-3 py-2 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate whitespace-nowrap text-left">{selectedLabel}</span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-outline-variant/20 bg-white shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${
                opt.value === value ? 'bg-primary/10 font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">{opt.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                {opt.priceLabel ? (
                  <span className="whitespace-nowrap font-semibold tabular-nums">{opt.priceLabel}</span>
                ) : null}
                {opt.value === value && (
                  <span className="material-symbols-outlined text-sm" aria-hidden>check</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
