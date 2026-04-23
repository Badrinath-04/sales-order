import { salesTrendBars } from '../data'

export default function SalesChart() {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm lg:col-span-2">
      <div className="mb-8 flex items-center justify-between">
        <h4 className="font-headline text-lg font-bold text-on-surface">Sales Trend</h4>
        <div className="flex rounded-lg bg-surface-container-low p-1">
          <button type="button" className="rounded-md bg-white px-4 py-1 text-xs font-bold shadow-sm">
            Weekly
          </button>
          <button type="button" className="rounded-md px-4 py-1 text-xs font-bold text-on-surface-variant">
            Monthly
          </button>
        </div>
      </div>
      <div className="relative flex h-64 items-end gap-2">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
          <div className="border-b border-outline" />
        </div>
        {salesTrendBars.map((bar) => (
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
      <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
        <span>SUN</span>
      </div>
    </div>
  )
}
