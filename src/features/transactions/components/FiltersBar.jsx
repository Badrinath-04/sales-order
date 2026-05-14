import { useCallback, useMemo } from 'react'
import { classLabelForGrade } from '@/utils/classes'
import { metaApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const DATE_OPTS = [
  { value: 'today', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
]

const DUES_STATUS_OPTS = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
]

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

function Select({ icon, value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant" aria-hidden>{icon}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-xl border border-outline-variant/20 bg-white py-2 ${icon ? 'pl-8' : 'pl-4'} pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" aria-hidden>expand_more</span>
    </div>
  )
}

export default function FiltersBar({
  filters,
  onChange,
  onApply,
  onClear,
  mode = 'transactions',
  catalogBranchId,
}) {
  const fetchCatalog = useCallback(
    () => metaApi.catalog(catalogBranchId ? { params: { branchId: catalogBranchId } } : {}),
    [catalogBranchId],
  )
  const { data: catalog, loading: catalogLoading } = useApi(fetchCatalog, null, [catalogBranchId])

  const methodOptions = useMemo(() => catalog?.paymentMethods ?? [], [catalog])
  const paymentStatusOpts = useMemo(() => catalog?.paymentStatuses ?? [], [catalog])
  const classOpts = useMemo(() => catalog?.classOptions ?? [], [catalog])

  const statusOptions = mode === 'dues'
    ? DUES_STATUS_OPTS
    : paymentStatusOpts

  const catalogReady = Boolean(catalog && !catalogLoading)

  const activeChips = [
    filters.class && {
      key: 'class',
      label: classOpts.find((o) => String(o.value) === String(filters.class))?.label ?? classLabelForGrade(filters.class),
    },
    filters.status && { key: 'status', label: statusOptions.find((o) => o.value === filters.status)?.label },
    filters.method && { key: 'method', label: methodOptions.find((o) => o.value === filters.method)?.label },
    filters.search && { key: 'search', label: `Search: ${filters.search}` },
  ].filter(Boolean)

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-4">
        <input
          value={filters.search}
          onChange={(e) => onChange?.('search', e.target.value)}
          placeholder="Search order, student or roll..."
          className="min-w-[220px] rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Select icon="calendar_today" value={filters.date} onChange={(v) => onChange?.('date', v)} options={DATE_OPTS} placeholder="Date Range" />
        <Select
          icon="school"
          value={filters.class}
          onChange={(v) => onChange?.('class', v)}
          options={classOpts}
          placeholder={catalogReady ? 'All Classes' : 'Loading classes…'}
          disabled={catalogLoading || !catalogReady}
        />
        <Select
          icon="payments"
          value={filters.status}
          onChange={(v) => onChange?.('status', v)}
          options={statusOptions}
          placeholder={catalogReady ? 'Payment Status' : 'Loading statuses…'}
          disabled={catalogLoading || (mode !== 'dues' && !catalogReady)}
        />
        <Select
          icon="account_balance_wallet"
          value={filters.method}
          onChange={(v) => onChange?.('method', v)}
          options={methodOptions}
          placeholder={catalogReady ? 'Payment Method' : 'Loading methods…'}
          disabled={catalogLoading || !catalogReady}
        />
        {mode === 'dues' && (
          <div className="relative min-w-[210px]">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-base text-on-surface-variant" aria-hidden>
              sort
            </span>
            <select
              value={filters.dueSort || 'desc'}
              onChange={(e) => onChange?.('dueSort', e.target.value)}
              title="Order due amounts"
              className="w-full appearance-none rounded-xl border border-outline-variant/20 bg-white py-2 pl-9 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="desc">Due: high → low</option>
              <option value="asc">Due: low → high</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" aria-hidden>
              expand_more
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => onApply?.()}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-on-primary shadow-md hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden>filter_list</span>
          Apply Filters
        </button>
        {activeChips.length > 0 && (
          <button type="button" onClick={() => onClear?.()}
            className="text-xs font-medium text-on-surface-variant underline hover:text-error">
            Clear all
          </button>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} onRemove={() => onChange?.(chip.key, '')} />
          ))}
        </div>
      )}
    </div>
  )
}
