import { salesTrendBars } from '../data'

/**
 * @param {{ id: string, pct: number, studentPct?: number, shortLabel?: string, emphasized?: boolean, peakLabel?: string | null, uniqueStudents?: number, transactionCount?: number }[]} [apiBars]
 *        When set, renders trend from API (`pct` is 0–100 relative to max day).
 */
export default function SalesChart({ apiBars, weekly = true, onToggleWeekly }) {
  const useApi = Array.isArray(apiBars) && apiBars.length > 0
  const showSpanToggle = typeof onToggleWeekly === 'function'

  return (
    <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm lg:col-span-2">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-headline text-lg font-bold text-on-surface">Revenue and students trend</h4>
          <div className="mt-1 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-primary" aria-hidden />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-teal-600" aria-hidden />
              Unique students
            </span>
          </div>
        </div>
        {showSpanToggle ? (
          <div className="flex rounded-lg bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => onToggleWeekly?.(true)}
              className={`rounded-md px-4 py-1 text-xs font-bold ${weekly ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => onToggleWeekly?.(false)}
              className={`rounded-md px-4 py-1 text-xs font-bold ${!weekly ? 'bg-white shadow-sm' : 'text-on-surface-variant'}`}
            >
              Monthly
            </button>
          </div>
        ) : (
          <span className="text-xs font-medium text-on-surface-variant">By payment date</span>
        )}
      </div>
      <div className="relative flex h-64 items-end gap-2">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
        </div>
        {useApi
          ? apiBars.map((bar) => (
              <div key={bar.id} className="relative flex h-full min-h-0 flex-1 flex-col justify-end">
                <div
                  style={{ height: `${Math.min(100, Math.max(6, bar.pct ?? 0))}%` }}
                  className={`relative w-full rounded-t-lg transition-all ${
                    bar.emphasized ? 'bg-primary hover:opacity-90' : 'bg-primary/10 hover:bg-primary/20'
                  }`}
                >
                  {bar.peakLabel ? (
                    <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-on-background px-2 py-1 text-[10px] text-white shadow-lg">
                      {bar.peakLabel}
                    </div>
                  ) : null}
                </div>
                <div
                  className="absolute bottom-0 left-1/2 w-1 -translate-x-1/2 rounded-t bg-teal-600 shadow-sm"
                  style={{ height: `${Math.min(100, Math.max(bar.uniqueStudents ? 8 : 0, bar.studentPct ?? 0))}%` }}
                  title={`${bar.uniqueStudents ?? 0} unique students · ${bar.transactionCount ?? 0} transactions`}
                />
              </div>
            ))
          : salesTrendBars.map((bar) => (
              <div
                key={bar.id}
                className={`relative flex-1 rounded-t-lg transition-all ${
                  bar.emphasized ? 'bg-primary hover:opacity-90' : 'bg-primary/10 hover:bg-primary/20'
                } ${bar.heightClass}`}
              >
                {bar.peakLabel ? (
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-on-background px-2 py-1 text-[10px] text-white shadow-lg">
                    {bar.peakLabel}
                  </div>
                ) : null}
              </div>
            ))}
      </div>
      <div className="mt-4 flex justify-between gap-0.5 overflow-hidden px-1 text-[9px] font-bold uppercase tracking-tight text-on-surface-variant">
        {useApi && apiBars.some((b) => b.shortLabel)
          ? apiBars.map((bar) => (
              <span key={bar.id} className="min-w-0 flex-1 truncate text-center">
                {bar.shortLabel ?? '—'}
              </span>
            ))
          : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
              <span key={d} className="flex-1 text-center">
                {d}
              </span>
            ))}
      </div>
    </div>
  )
}
