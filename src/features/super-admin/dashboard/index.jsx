import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityFeed from '@/components/ui/ActivityFeed'
import KPICard from '@/components/ui/KPICard'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import SchoolsTable from './components/SchoolsTable'
import './styles.scss'

const HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDBPCj5uB4qVU8PgUsDySXkT7S6XCOQ9bP30PWDGBWdXRqzs3dpYSuippw0yFhsi_XZPFDlmqNB07bVsUzeo1zhkDYNv90Tb_CQosUx0H80-IWMIC3Qiwt-u3YzVMnwoGNgC-rXxnQ2vcbevClOoqs-5bCMAtGc9nAIUwLO2ZyLWa5VXwkBrrB5bm97OQugMd2e5Wtic9U2QPOhU_aAfMgFavdA1CBS3ki1TUPMwLSEZuDWFuHga8v9iXeFdwE2RlUsjEiA2QOJNc'

function formatCurrency(n) {
  if (!n) return '$0'
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function formatMoney(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  const fetchDashboard = useCallback(() => reportsApi.superDashboard(), [])
  const { data, loading } = useApi(fetchDashboard, null, [])

  const kpis = data?.kpis ?? {}
  const branchStats = data?.branchStats ?? []
  const recentOrders = data?.recentOrders ?? []

  const KPI_ITEMS = [
    {
      id: 'schools',
      title: 'Total Campuses',
      value: loading ? '…' : String(kpis.totalBranches ?? 0),
      icon: 'domain',
      iconWrapClassName: 'bg-primary-fixed text-primary',
    },
    {
      id: 'orders',
      title: 'Orders Today',
      value: loading ? '…' : String(kpis.ordersToday ?? 0),
      icon: 'groups',
      iconWrapClassName: 'bg-secondary-fixed text-secondary',
    },
    {
      id: 'revenue',
      title: 'Revenue Today',
      value: loading ? '…' : formatCurrency(kpis.revenueToday),
      icon: 'payments',
      iconWrapClassName: 'bg-tertiary-fixed text-tertiary',
    },
    {
      id: 'pending',
      title: 'Pending Revenue',
      value: loading ? '…' : formatMoney(kpis.pendingRevenue ?? 0),
      icon: 'account_balance_wallet',
      iconWrapClassName: 'bg-tertiary-container text-on-tertiary-container',
      pill:
        (kpis.pendingRevenue ?? 0) > 0
          ? { text: 'Outstanding', className: 'rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900' }
          : undefined,
    },
  ]

  const topBranches = [...branchStats]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)

  const maxRevenue = topBranches[0]?.revenue || 1

  const schools = branchStats.map((b) => ({
    id: b.id,
    name: b.name,
    location: b.code,
    totalOrders30d: b.totalOrders ?? 0,
    revenue30d: b.revenue ?? 0,
    status: (b.revenue ?? 0) > 0 ? 'Active' : 'Quiet',
  }))

  const ACTIVITIES = recentOrders.slice(0, 3).map((o) => ({
    id: o.id,
    title: `Order ${o.orderId}`,
    detail: `${o.student?.name ?? 'Student'} • ${o.branch?.name ?? ''}`,
    time: new Date(o.createdAt).toLocaleDateString(),
    accent: 'primary',
  }))

  return (
    <>
      <div className="mb-6 md:mb-10">
        <h2 className="font-headline text-2xl md:text-4xl font-extrabold tracking-tight text-on-surface">Dashboard</h2>
        <p className="mt-1 text-on-surface-variant">
          Operational overview for reporting, stock, and revenue across all campuses.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-grow space-y-8">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {KPI_ITEMS.map((kpi) => (
              <KPICard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                iconWrapClassName={kpi.iconWrapClassName}
                pill={kpi.pill}
              />
            ))}
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Reports</h3>
                <p className="text-sm text-on-surface-variant">
                  Network revenue trend and order throughput across campuses.
                </p>
              </div>
            </div>
            <div className="relative h-64 w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 1000 200">
                <defs>
                  <linearGradient id="superAdminChartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#005da7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#005da7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,150 Q100,120 200,160 T400,80 T600,120 T800,40 T1000,60"
                  fill="none"
                  stroke="#005da7"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
                <path
                  d="M0,150 Q100,120 200,160 T400,80 T600,120 T800,40 T1000,60 V200 H0 Z"
                  fill="url(#superAdminChartGradient)"
                />
              </svg>
              <div className="mt-4 flex justify-between px-2 text-xs font-medium text-on-surface-variant">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl bg-surface-container-lowest p-8">
              <h3 className="mb-6 font-headline text-xl font-bold text-on-surface">Top Campuses</h3>
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading…</p>
              ) : (
                <div className="space-y-6">
                  {topBranches.map((b) => {
                    const pct = Math.round((b.revenue / maxRevenue) * 100)
                    return (
                      <div key={b.id} className="space-y-2">
                        <div className="flex justify-between text-sm font-label">
                          <span>{b.name}</span>
                          <span className="font-bold">{formatCurrency(b.revenue)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                          <div
                            className="h-full max-w-full bg-gradient-to-r from-primary to-primary-container"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {topBranches.length === 0 && (
                    <p className="text-sm text-on-surface-variant">No campus data yet.</p>
                  )}
                </div>
              )}
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-surface-container-lowest p-8">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 to-transparent" />
              <div className="relative flex h-full min-h-[280px] flex-col justify-end text-white">
                <h4 className="font-headline text-2xl font-bold">New Inventory Just Arrived</h4>
                <p className="mt-2 text-sm opacity-80">
                  Review stock before the next peak ordering period.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/super/stock')}
                  className="mt-4 w-fit rounded-full bg-white px-6 py-2 text-sm font-bold text-on-surface"
                >
                  Review Stock
                </button>
              </div>
            </div>
          </div>

          <SchoolsTable schools={schools} />
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-80">
          <div className="rounded-xl bg-surface-container-lowest p-6">
            <h3 className="mb-4 font-headline text-lg font-bold text-on-surface">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('/super/orders/new')}
                className="group flex w-full items-center gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <span className="material-symbols-outlined" aria-hidden>add_shopping_cart</span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">New Order</p>
                  <p className="text-xs text-on-surface-variant">Process manual orders</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/super/stock')}
                className="group flex w-full items-center gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                  <span className="material-symbols-outlined" aria-hidden>add_box</span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">Add Stock</p>
                  <p className="text-xs text-on-surface-variant">Inbound warehouse update</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/super/reports')}
                className="group flex w-full items-center gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary text-on-tertiary">
                  <span className="material-symbols-outlined" aria-hidden>point_of_sale</span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">Reports</p>
                  <p className="text-xs text-on-surface-variant">Campus performance & trends</p>
                </div>
              </button>
            </div>
          </div>

          <ActivityFeed activities={ACTIVITIES.length > 0 ? ACTIVITIES : [{ id: 'empty', title: 'No recent activity', detail: 'Orders will appear here', time: '', accent: 'primary' }]} />
        </aside>
      </div>
    </>
  )
}
