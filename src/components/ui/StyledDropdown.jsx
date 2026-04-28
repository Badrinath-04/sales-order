import { useMemo, useState } from 'react'

export default function StyledDropdown({ value, options, onChange, className = '', disabled = false }) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => options.find((o) => o.value === value) ?? options[0], [options, value])

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-highest px-3 py-2 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{selected?.label ?? 'Select'}</span>
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
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${
                opt.value === value ? 'bg-primary/10 font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <span className="material-symbols-outlined text-sm" aria-hidden>check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
