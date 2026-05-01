export function formatUsd(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const MAX_TREND_BARS = 14

/** Map `/reports/sales-trend` rows to chart bars (relative height). */
export function mapTrendToBars(trend, formatPeak = formatUsd) {
  const raw = Array.isArray(trend) ? trend : []
  const points = raw.length > MAX_TREND_BARS ? raw.slice(-MAX_TREND_BARS) : [...raw]
  const padded = [...points]
  while (padded.length < MAX_TREND_BARS) padded.unshift({ date: '', total: 0 })
  if (padded.length === 0) padded.push({ date: '', total: 0 })
  const nums = padded.map((p) => Number(p.total))
  const max = Math.max(...nums, 1)
  const peakIdx = nums.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0)
  return padded.map((t, i) => ({
    id: String(t.date || `d-${i}`),
    shortLabel: t.date
      ? new Date(`${t.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—',
    pct: (Number(t.total) / max) * 100,
    emphasized: i === peakIdx && Number(t.total) > 0,
    peakLabel: i === peakIdx && Number(t.total) > 0 ? `Peak: ${formatPeak(t.total)}` : null,
  }))
}

/**
 * @param {object} kpis
 * @param {{ periodLabel?: string }} [options]
 */
export function mapSuperDashboardToMetrics(kpis, options = {}) {
  if (!kpis) return null
  const periodLabel = options.periodLabel ?? 'Today'
  const rev = Number(kpis.revenueToday || 0)
  const ord = Number(kpis.ordersToday || 0)
  const pendingRev = Number(kpis.pendingRevenue ?? 0)
  const avg = ord > 0 ? rev / ord : 0
  return [
    {
      id: 'revenue',
      label: `Total Revenue (${periodLabel})`,
      value: formatUsd(rev),
      icon: 'payments',
      iconWrapClassName: 'rounded-lg bg-primary/10 p-2 text-primary',
      pill: { text: periodLabel, className: 'rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600' },
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: String(ord),
      icon: 'shopping_cart',
      iconWrapClassName: 'rounded-lg bg-primary/10 p-2 text-primary',
      pill: { text: 'Active', className: 'rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700' },
    },
    {
      id: 'avg',
      label: 'Avg Order Value',
      value: formatUsd(avg),
      icon: 'bar_chart',
      iconWrapClassName: 'rounded-lg bg-orange-100 p-2 text-orange-700',
      pill: { text: 'Stable', className: 'rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600' },
    },
    {
      id: 'pending',
      label: 'Pending Revenue',
      value: formatUsd(pendingRev),
      icon: 'account_balance_wallet',
      iconWrapClassName: 'rounded-lg bg-amber-100 p-2 text-amber-800',
      pill: {
        text: pendingRev > 0 ? 'Outstanding' : 'Clear',
        className:
          pendingRev > 0
            ? 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900'
            : 'rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600',
      },
    },
  ]
}

export function mapBranchPerformanceToCampuses(perf) {
  if (!Array.isArray(perf) || !perf.length) return []
  const sorted = [...perf].sort((a, b) => Number(b.revenue) - Number(a.revenue))
  return sorted.map((b) => ({
    id: b.id,
    letter: (b.code || b.name || '?').trim().slice(0, 1).toUpperCase(),
    name: b.name,
    orders: `${b.totalOrders ?? 0} Orders`,
    revenue: formatUsd(b.revenue),
  }))
}

export function mapInsightsFromPerformance(perf, pendingRevenueKpi) {
  if (!Array.isArray(perf) || perf.length < 1) return null
  const sorted = [...perf].sort((a, b) => Number(b.revenue) - Number(a.revenue))
  const top = sorted[0]
  const weak = sorted[sorted.length - 1]
  return [
    {
      id: 'top',
      icon: 'trending_up',
      iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white',
      title: 'Top Performing',
      body: `${top.name} (${formatUsd(top.revenue)} period revenue)`,
    },
    {
      id: 'attention',
      icon: 'warning',
      iconClassName: 'material-symbols-outlined shrink-0 text-xl text-amber-200',
      title: 'Needs Attention',
      body: `${weak.name} (lowest period revenue)`,
    },
    {
      id: 'kits',
      icon: 'info',
      iconClassName: 'material-symbols-outlined shrink-0 text-xl text-white/90',
      title: 'Pending revenue (network)',
      body: `${formatUsd(pendingRevenueKpi ?? 0)} outstanding on orders in this period`,
    },
  ]
}

export function mapRecentOrdersToTableRows(orders) {
  if (!Array.isArray(orders)) return undefined
  const img =
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=120&q=60'
  if (orders.length === 0) return []
  return orders.map((o) => ({
    id: o.id,
    product: o.orderId ? `Order ${o.orderId}` : 'Order',
    student: o.student?.name ?? '—',
    campus: o.branch?.name ?? '—',
    date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: formatUsd(o.total),
    status: o.paymentStatus === 'PAID' ? 'paid' : o.paymentStatus === 'PARTIAL' ? 'processing' : 'pending',
    imageUrl: img,
  }))
}
