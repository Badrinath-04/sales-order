import { useState } from 'react'
import { SCHOOL_CLASSES, classLabelForGrade } from '@/utils/classes'

const DATE_OPTS = [
  { value: 'today',    label: 'Last 24 Hours' },
  { value: '7d',       label: 'Last 7 Days' },
  { value: '30d',      label: 'Last 30 Days' },
  { value: '90d',      label: 'Last 3 Months' },
]

const STATUS_OPTS = [
  { value: 'PAID',    label: 'Paid' },
  { value: 'UNPAID',  label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
]

const METHOD_OPTS = [
  { value: 'CASH',    label: 'Cash' },
  { value: 'GPAY',    label: 'Google Pay' },
  { value: 'PHONEPE', label: 'PhonePe' },
  { value: 'PAYTM',   label: 'Paytm' },
  { value: 'CARD',    label: 'Card' },
  { value: 'CREDIT',  label: 'Credit' },
  { value: 'ONLINE',  label: 'Online / NEFT' },
  { value: 'OTHER',   label: 'Other' },
]

const CLASS_OPTS = SCHOOL_CLASSES.map((item) => ({ value: String(item.grade), label: item.label }))

function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
      {label}
      <button type="button" onClick={onRemove} className="ml-1 hover:text-error" aria-label={`Remove ${label} filter`}>
        <span className="material-symbols-outlined text-[14px]" aria-hidden>close</span>
      </button>
    </span>
  )
}

function Select({ icon, value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant" aria-hidden>{icon}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-xl border border-outline-variant/20 bg-white py-2 ${icon ? 'pl-8' : 'pl-4'} pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" aria-hidden>expand_more</span>
    </div>
  )
}

export default function FiltersBar() {
  const [filters, setFilters] = useState({ date: '7d', class: '', status: '', method: '' })

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const activeChips = [
    filters.class  && { key: 'class',  label: classLabelForGrade(filters.class) },
    filters.status && { key: 'status', label: STATUS_OPTS.find((o) => o.value === filters.status)?.label },
    filters.method && { key: 'method', label: METHOD_OPTS.find((o) => o.value === filters.method)?.label },
  ].filter(Boolean)

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-4">
        <Select icon="calendar_today" value={filters.date} onChange={(v) => set('date', v)} options={DATE_OPTS} placeholder="Date Range" />
        <Select icon="school" value={filters.class} onChange={(v) => set('class', v)} options={CLASS_OPTS} placeholder="All Classes" />
        <Select icon="payments" value={filters.status} onChange={(v) => set('status', v)} options={STATUS_OPTS} placeholder="Payment Status" />
        <Select icon="account_balance_wallet" value={filters.method} onChange={(v) => set('method', v)} options={METHOD_OPTS} placeholder="Payment Method" />
        <button
          type="button"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-on-primary shadow-md hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden>filter_list</span>
          Apply Filters
        </button>
        {activeChips.length > 0 && (
          <button type="button" onClick={() => setFilters((f) => ({ ...f, class: '', status: '', method: '' }))}
            className="text-xs font-medium text-on-surface-variant underline hover:text-error">
            Clear all
          </button>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} onRemove={() => set(chip.key, '')} />
          ))}
        </div>
      )}
    </div>
  )
}
