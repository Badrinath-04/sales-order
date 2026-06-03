import { useCallback, useMemo } from 'react'
import { classLabelForGrade } from '@/utils/classes'
import { metaApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { TRANSACTION_DATE_OPTS } from '../transactionDateRange'

const DATE_OPTS = TRANSACTION_DATE_OPTS

const DUES_STATUS_OPTS = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
]

const FALLBACK_PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CANARA_UPI', label: 'Canara Bank UPI' },
  { value: 'UPI_BHARATH', label: 'UPI to Bharath Kumar' },
  { value: 'UPI_POORNIMA', label: 'UPI to Poornima' },
  { value: 'BOB_UPI', label: 'BOB UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'GPAY', label: 'Google Pay' },
  { value: 'PHONEPE', label: 'PhonePe' },
  { value: 'PAYTM', label: 'Paytm' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'OTHER', label: 'Other' },
]

const FALLBACK_PAYMENT_STATUSES = [
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'UNPAID', label: 'Unpaid' },
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

const fieldClass =
  'w-full min-w-0 rounded-xl border border-outline-variant/20 bg-white px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transactions-filter-field'

function Select({ icon, value, onChange, options, placeholder, disabled, showEmptyOption = true, className = '' }) {
  return (
    <div className={`transactions-filter-select relative min-w-[140px] flex-1 lg:flex-none lg:min-w-[160px] ${className}`}>
      {icon && (
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant" aria-hidden>{icon}</span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none ${fieldClass} ${icon ? 'pl-8' : 'pl-4'} pr-8 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {showEmptyOption ? <option value="">{placeholder}</option> : null}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" aria-hidden>expand_more</span>
    </div>
  )
}

function DateField({ label, optional, value, onChange, min, id }) {
  return (
    <div className="min-w-0 flex-1 lg:max-w-[180px]">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-on-surface-variant">
        {label}
        {optional ? <span className="font-normal text-on-surface-variant/70"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </div>
  )
}

export default function FiltersBar({
  filters,
  appliedFilters: appliedFiltersProp,
  onChange,
  onApply,
  onClear,
  viewMode = 'transactions',
  onViewModeChange,
  onPrint,
  showPrint = false,
  printDisabled = false,
  mode = 'transactions',
  catalogBranchId,
  customDateError = '',
  dateOptions = DATE_OPTS,
}) {
  const appliedFilters = appliedFiltersProp ?? filters
  const fetchCatalog = useCallback(
    () => metaApi.catalog(catalogBranchId ? { params: { branchId: catalogBranchId } } : {}),
    [catalogBranchId],
  )
  const { data: catalog, loading: catalogLoading } = useApi(fetchCatalog, null, [catalogBranchId])

  const methodOptions = useMemo(
    () => (catalog?.paymentMethods?.length ? catalog.paymentMethods : FALLBACK_PAYMENT_METHODS),
    [catalog],
  )
  const paymentStatusOpts = useMemo(
    () => (catalog?.paymentStatuses?.length ? catalog.paymentStatuses : FALLBACK_PAYMENT_STATUSES),
    [catalog],
  )
  const classOpts = useMemo(() => catalog?.classOptions ?? [], [catalog])

  const statusOptions = mode === 'dues' ? DUES_STATUS_OPTS : paymentStatusOpts

  const classesReady = Boolean(!catalogLoading && catalog)
  const catalogReady = !catalogLoading

  const activeChips = [
    appliedFilters.date && {
      key: 'date',
      label:
        appliedFilters.date === 'custom'
          ? (appliedFilters.customDateFrom
            ? `Custom: ${appliedFilters.customDateFrom}${appliedFilters.customDateTo && appliedFilters.customDateTo !== appliedFilters.customDateFrom ? ` → ${appliedFilters.customDateTo}` : ''}`
            : 'Custom Date')
          : (dateOptions.find((o) => o.value === appliedFilters.date)?.label ?? appliedFilters.date),
    },
    appliedFilters.class && {
      key: 'class',
      label: classOpts.find((o) => String(o.value) === String(appliedFilters.class))?.label ?? classLabelForGrade(appliedFilters.class),
    },
    appliedFilters.status && { key: 'status', label: statusOptions.find((o) => o.value === appliedFilters.status)?.label },
    appliedFilters.method && { key: 'method', label: methodOptions.find((o) => o.value === appliedFilters.method)?.label },
    appliedFilters.search && { key: 'search', label: `Search: ${appliedFilters.search}` },
  ].filter(Boolean)

  return (
    <div className="transactions-filters-shell">
      <div className="transactions-filters-panel">
        <div className="transactions-filters-rows-mobile">
          <div className="transactions-filters-row transactions-filters-row--primary">
            {mode === 'transactions' ? (
              <div className="transactions-view-toggle flex shrink-0 rounded-xl bg-white p-1 shadow-sm ring-1 ring-outline-variant/20">
                {[
                  { id: 'transactions', label: 'All Transactions' },
                  { id: 'students', label: 'By Student' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onViewModeChange?.(option.id)}
                    className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      viewMode === option.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              value={filters.search}
              onChange={(e) => onChange?.('search', e.target.value)}
              placeholder="Search order, student or roll..."
              className={`transactions-search-input min-w-0 flex-1 ${fieldClass} px-4`}
            />
            <div className="hidden lg:contents">
              <Select
                icon="calendar_today"
                value={filters.date}
                onChange={(v) => onChange?.('date', v)}
                options={dateOptions}
                placeholder="Date Range"
                showEmptyOption={false}
              />
              <Select
                icon="school"
                value={filters.class}
                onChange={(v) => onChange?.('class', v)}
                options={classOpts}
                placeholder={classesReady ? 'All Classes' : 'Loading classes…'}
                disabled={catalogLoading || !classesReady}
              />
              <Select
                icon="payments"
                value={filters.status}
                onChange={(v) => onChange?.('status', v)}
                options={statusOptions}
                placeholder="Payment Status"
                disabled={catalogLoading}
              />
              <Select
                icon="account_balance_wallet"
                value={filters.method}
                onChange={(v) => onChange?.('method', v)}
                options={methodOptions}
                placeholder="Payment Method"
                disabled={catalogLoading}
              />
            </div>
          </div>

          <div className="transactions-filters-row transactions-filters-row--dropdowns lg:hidden">
            <Select
              icon="calendar_today"
              value={filters.date}
              onChange={(v) => onChange?.('date', v)}
              options={dateOptions}
              placeholder="Date Range"
              showEmptyOption={false}
            />
            <Select
              icon="school"
              value={filters.class}
              onChange={(v) => onChange?.('class', v)}
              options={classOpts}
              placeholder={classesReady ? 'All Classes' : 'Loading classes…'}
              disabled={catalogLoading || !classesReady}
            />
            <Select
              icon="payments"
              value={filters.status}
              onChange={(v) => onChange?.('status', v)}
              options={statusOptions}
              placeholder="Payment Status"
              disabled={catalogLoading}
            />
            <Select
              icon="account_balance_wallet"
              value={filters.method}
              onChange={(v) => onChange?.('method', v)}
              options={methodOptions}
              placeholder="Payment Method"
              disabled={catalogLoading}
            />
          </div>

          {mode === 'dues' && (
            <div className="transactions-filters-row mb-2 lg:mb-0">
              <div className="relative min-w-0 w-full flex-1 lg:min-w-[210px] lg:flex-none">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-base text-on-surface-variant" aria-hidden>
                  sort
                </span>
                <select
                  value={filters.dueSort || 'desc'}
                  onChange={(e) => onChange?.('dueSort', e.target.value)}
                  title="Order due amounts"
                  className="w-full min-h-[44px] appearance-none rounded-xl border border-outline-variant/20 bg-white py-2.5 pl-9 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="desc">Due: high → low</option>
                  <option value="asc">Due: low → high</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant" aria-hidden>
                  expand_more
                </span>
              </div>
            </div>
          )}

          <div className="transactions-filters-row transactions-filters-row--actions">
            {showPrint ? (
              <button
                type="button"
                onClick={() => onPrint?.()}
                disabled={printDisabled}
                className="transactions-filter-action flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 bg-white px-4 py-2.5 font-body text-sm font-bold text-on-surface shadow-sm transition-opacity hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden>print</span>
                Print / Download
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onApply?.()}
              className="transactions-filter-action flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-body text-sm font-bold text-on-primary shadow-md transition-opacity hover:opacity-90 lg:w-auto"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>filter_list</span>
              Apply Filters
            </button>
            {activeChips.length > 0 ? (
              <button
                type="button"
                onClick={() => onClear?.()}
                className="transactions-filter-clear text-xs font-medium text-on-surface-variant underline hover:text-error"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        {filters.date === 'custom' && (
          <div
            className="mt-3 flex flex-col gap-3 border-t border-outline-variant/20 pt-3 sm:flex-row sm:flex-wrap sm:items-end"
            role="group"
            aria-label="Custom date range"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant sm:mr-1 sm:w-auto sm:pb-2">
              <span className="material-symbols-outlined text-base text-tertiary" aria-hidden>date_range</span>
              <span className="uppercase tracking-wide">Custom range</span>
            </div>
            <DateField
              id="tx-filter-date-from"
              label="From"
              value={filters.customDateFrom || ''}
              onChange={(v) => onChange?.('customDateFrom', v)}
            />
            <span className="hidden self-end pb-2 text-sm text-on-surface-variant sm:inline" aria-hidden>—</span>
            <DateField
              id="tx-filter-date-to"
              label="To"
              optional
              value={filters.customDateTo || ''}
              min={filters.customDateFrom || undefined}
              onChange={(v) => onChange?.('customDateTo', v)}
            />
            <button
              type="button"
              onClick={() => onApply?.()}
              className="w-full shrink-0 rounded-full border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-lowest sm:w-auto sm:self-end"
            >
              Apply range
            </button>
            {customDateError ? (
              <p className="w-full basis-full text-xs font-medium text-error">{customDateError}</p>
            ) : null}
          </div>
        )}
      </div>
      {activeChips.length > 0 && (
        <div className="transactions-filter-chips">
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onRemove={() => {
                if (chip.key === 'date') {
                  onChange?.('date', 'all')
                  onChange?.('customDateFrom', '')
                  onChange?.('customDateTo', '')
                }
                else onChange?.(chip.key, '')
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
