import { useNavigate } from 'react-router-dom'
import ActivityFeed from '@/components/ui/ActivityFeed'
import KPICard from '@/components/ui/KPICard'
import SchoolsTable from './components/SchoolsTable'
import './styles.scss'

const HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDBPCj5uB4qVU8PgUsDySXkT7S6XCOQ9bP30PWDGBWdXRqzs3dpYSuippw0yFhsi_XZPFDlmqNB07bVsUzeo1zhkDYNv90Tb_CQosUx0H80-IWMIC3Qiwt-u3YzVMnwoGNgC-rXxnQ2vcbevClOoqs-5bCMAtGc9nAIUwLO2ZyLWa5VXwkBrrB5bm97OQugMd2e5Wtic9U2QPOhU_aAfMgFavdA1CBS3ki1TUPMwLSEZuDWFuHga8v9iXeFdwE2RlUsjEiA2QOJNc'

const KPI_ITEMS = [
  {
    id: 'schools',
    title: 'Total Campuses',
    value: '128',
    icon: 'domain',
    iconWrapClassName: 'bg-primary-fixed text-primary',
    pill: {
      text: '+8%',
      className: 'rounded-full bg-tertiary-fixed px-2 py-1 text-xs font-bold text-tertiary',
    },
  },
  {
    id: 'students',
    title: 'Total Orders',
    value: '24,560',
    icon: 'groups',
    iconWrapClassName: 'bg-secondary-fixed text-secondary',
  },
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$1,250,000',
    icon: 'payments',
    iconWrapClassName: 'bg-tertiary-fixed text-tertiary',
  },
  {
    id: 'admins',
    title: 'Active Terminals',
    value: '42',
    icon: 'admin_panel_settings',
    iconWrapClassName: 'bg-error-container text-error',
    pill: {
      text: 'Live',
      className: 'rounded-full bg-error-container px-2 py-1 text-xs font-bold text-error',
    },
  },
]

const TOP_SCHOOLS = [
  { id: 't1', name: 'Oakwood Academy', amount: '$12,000', barClass: 'w-[100%]' },
  { id: 't2', name: "St. Mary's", amount: '$9,500', barClass: 'w-[79%]' },
  { id: 't3', name: 'Delhi Public School', amount: '$8,200', barClass: 'w-[68%]' },
]

const SCHOOLS = [
  {
    id: '1',
    name: 'Northbridge Academy',
    location: 'Austin, TX',
    students: 1840,
    revenue: 412000,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Harborview Preparatory',
    location: 'Seattle, WA',
    students: 960,
    revenue: 198500,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Cedar Grove International',
    location: 'Toronto, ON',
    students: 2210,
    revenue: 356200,
    status: 'Active',
  },
  {
    id: '4',
    name: 'Riverside STEM Campus',
    location: 'Denver, CO',
    students: 1425,
    revenue: 289750,
    status: 'Inactive',
  },
  {
    id: '5',
    name: 'Summit Day School',
    location: 'Boston, MA',
    students: 680,
    revenue: 124800,
    status: 'Active',
  },
]

const ACTIVITIES = [
  {
    id: 'a1',
    title: 'Kit Dispatched',
    detail: 'Order #9284 for Grade 12',
    time: '2 mins ago',
    accent: 'primary',
  },
  {
    id: 'a2',
    title: 'Stock Warning',
    detail: 'Class 4 Kits below 10%',
    time: '45 mins ago',
    accent: 'secondary',
  },
  {
    id: 'a3',
    title: 'Payment Verified',
    detail: "$450.00 from St. Mary's",
    time: '2 hours ago',
    accent: 'tertiary',
  },
]

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  return (
    <>
      <div className="mb-10">
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Dashboard</h2>
        <p className="mt-1 text-on-surface-variant">
          Operational overview for sales, stock, and revenue across all campuses.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-grow space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
                <h3 className="font-headline text-xl font-bold text-on-surface">Sales Overview</h3>
                <p className="text-sm text-on-surface-variant">
                  Network revenue trend and order throughput across campuses.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                  Order volume is up <span className="font-bold text-primary">8%</span> this quarter while gross
                  revenue increased <span className="font-bold text-secondary">5.4%</span>. Fulfillment and stock
                  coverage remain stable across high-traffic terminals.
                </p>
              </div>
              <div className="hidden shrink-0 gap-2 sm:flex">
                <button
                  type="button"
                  className="rounded-full bg-surface-container-highest px-4 py-1 text-xs font-bold"
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className="rounded-full px-4 py-1 text-xs font-bold text-on-surface-variant"
                >
                  Monthly
                </button>
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
                <circle cx="200" cy="160" r="4" fill="white" stroke="#005da7" strokeWidth="2" />
                <circle cx="400" cy="80" r="4" fill="white" stroke="#005da7" strokeWidth="2" />
                <circle cx="800" cy="40" r="4" fill="white" stroke="#005da7" strokeWidth="2" />
              </svg>
              <div className="mt-4 flex justify-between px-2 text-xs font-medium text-on-surface-variant">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl bg-surface-container-lowest p-8">
              <h3 className="mb-6 font-headline text-xl font-bold text-on-surface">Top Campuses</h3>
              <div className="space-y-6">
                {TOP_SCHOOLS.map((row) => (
                  <div key={row.id} className="space-y-2">
                    <div className="flex justify-between text-sm font-label">
                      <span>{row.name}</span>
                      <span className="font-bold">{row.amount}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={`h-full max-w-full bg-gradient-to-r from-primary to-primary-container ${row.barClass}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                  Premium kit lines for upper grades are available for allocation. Review stock before the next sales
                  wave.
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

          <SchoolsTable schools={SCHOOLS} />
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-80">
          <div className="rounded-xl bg-surface-container-lowest p-6">
            <h3 className="mb-4 font-headline text-lg font-bold text-on-surface">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('/super/sales/orders/new')}
                className="group flex w-full items-center gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <span className="material-symbols-outlined" data-icon="add_shopping_cart" aria-hidden>
                    add_shopping_cart
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">New Order</p>
                  <p className="text-xs text-on-surface-variant">Process manual sales</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/super/stock')}
                className="group flex w-full items-center gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                  <span className="material-symbols-outlined" data-icon="add_box" aria-hidden>
                    add_box
                  </span>
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
                  <span className="material-symbols-outlined" data-icon="description" aria-hidden>
                    description
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">View Reports</p>
                  <p className="text-xs text-on-surface-variant">Detailed financial data</p>
                </div>
              </button>
            </div>
          </div>

          <ActivityFeed activities={ACTIVITIES} />
        </aside>
      </div>
    </>
  )
}
