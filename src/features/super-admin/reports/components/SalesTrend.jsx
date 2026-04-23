export default function SalesTrend() {
  return (
    <div className="rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="font-headline text-xl font-bold text-on-surface">Sales Trend</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary"
          >
            Weekly
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="group relative flex h-64 items-end justify-between gap-1">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between border-l border-outline-variant/20 py-2">
          <div className="w-full border-t border-outline-variant/10 pl-1 pt-1 text-[10px] text-on-surface-variant/40">
            $20k
          </div>
          <div className="w-full border-t border-outline-variant/10 pl-1 pt-1 text-[10px] text-on-surface-variant/40">
            $15k
          </div>
          <div className="w-full border-t border-outline-variant/10 pl-1 pt-1 text-[10px] text-on-surface-variant/40">
            $10k
          </div>
          <div className="w-full border-t border-outline-variant/10 pl-1 pt-1 text-[10px] text-on-surface-variant/40">
            $5k
          </div>
        </div>
        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="reportsLineGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#005da7" />
              <stop offset="100%" stopColor="#2976c7" />
            </linearGradient>
          </defs>
          <path
            d="M0,180 Q80,120 160,150 T320,80 T480,110 T600,40"
            fill="none"
            stroke="url(#reportsLineGradient)"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </svg>
        <div className="absolute -bottom-6 flex w-full justify-between text-[10px] font-bold text-on-surface-variant">
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
          <span>SUN</span>
        </div>
      </div>
    </div>
  )
}
