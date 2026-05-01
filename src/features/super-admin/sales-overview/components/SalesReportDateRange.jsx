import { SALES_RANGE_PRESETS, getSalesReportRange, toYmd } from '../dateRangePresets'

/**
 * @param {{
 *   preset: string,
 *   onPresetChange: (id: string) => void,
 *   customFrom: string,
 *   customTo: string,
 *   onCustomChange: (field: 'customFrom'|'customTo', value: string) => void,
 * }} props
 */
export default function SalesReportDateRange({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomChange,
}) {
  const range = getSalesReportRange(preset, { customFrom, customTo })

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Report period</p>
        <p className="text-sm text-on-surface-variant">
          {range.dateFrom === range.dateTo ? range.dateFrom : `${range.dateFrom} → ${range.dateTo}`}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-on-surface-variant">Range</span>
          <select
            value={preset}
            onChange={(e) => onPresetChange(e.target.value)}
            className="min-w-[180px] rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface shadow-sm outline-none ring-primary focus:ring-2"
          >
            {SALES_RANGE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {preset === 'custom' && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-on-surface-variant">From</span>
              <input
                type="date"
                value={customFrom || ''}
                max={customTo || toYmd(new Date())}
                onChange={(e) => onCustomChange('customFrom', e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm font-medium text-on-surface shadow-sm outline-none ring-primary focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-on-surface-variant">To</span>
              <input
                type="date"
                value={customTo || ''}
                min={customFrom || undefined}
                max={toYmd(new Date())}
                onChange={(e) => onCustomChange('customTo', e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm font-medium text-on-surface shadow-sm outline-none ring-primary focus:ring-2"
              />
            </label>
          </>
        )}
      </div>
    </div>
  )
}
