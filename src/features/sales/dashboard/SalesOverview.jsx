import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi, transactionsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { useShellPaths } from '@/hooks/useShellPaths'
import StatCard from './components/StatCard'
import TransactionItem from './components/TransactionItem'
import InventoryCard from './components/InventoryCard'
import './styles.scss'

function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SalesOverview() {
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { branchId } = useAdminSession()

  const fetchDashboard = useCallback(
    () => reportsApi.adminDashboard({ branchId }),
    [branchId],
  )
  const { data: dashData, loading: dashLoading } = useApi(fetchDashboard, null, [branchId])

  const fetchTransactions = useCallback(
    () => transactionsApi.list({ branchId, limit: 3 }),
    [branchId],
  )
  const { data: txData } = useApi(fetchTransactions, null, [branchId])

  const kpis = dashData?.kpis ?? {}
  const snap = dashData?.inventorySnapshot ?? {}

  const salesStats = [
    {
      id: 'revenue',
      label: "Today's Sales",
      value: dashLoading ? '…' : formatCurrency(kpis.revenueToday),
      icon: 'payments',
      iconWrapClassName: 'rounded-xl bg-primary/10 p-3 text-primary',
      topRight: { kind: 'text', text: 'Today', className: 'text-xs font-bold uppercase tracking-widest text-tertiary' },
    },
    {
      id: 'orders',
      label: 'Orders Today',
      value: dashLoading ? '…' : String(kpis.ordersToday ?? 0),
      icon: 'task_alt',
      iconWrapClassName: 'rounded-xl bg-secondary-container/30 p-3 text-secondary',
      topRight: { kind: 'pill', text: 'On Track', className: 'rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container' },
    },
    {
      id: 'pending',
      label: 'Pending Payments',
      value: dashLoading ? '…' : String(kpis.pendingPayments ?? 0),
      icon: 'pending_actions',
      iconWrapClassName: 'rounded-xl bg-tertiary/10 p-3 text-tertiary',
      topRight: { kind: 'pulseDot' },
    },
  ]

  const rawTx = Array.isArray(txData) ? txData : (txData?.data ?? [])
  const recentTransactions = rawTx.map((tx) => ({
    id: tx.id,
    title: tx.order?.student?.name ?? 'Unknown Student',
    meta: `${tx.order?.branch?.name ?? '—'} • ${new Date(tx.paidAt ?? tx.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
    amount: formatCurrency(tx.amount),
    icon: 'receipt_long',
    badgeText: tx.status === 'PAID' ? 'Paid' : tx.status === 'PARTIAL' ? 'Partial' : 'Pending',
    badgeClassName: tx.status === 'PAID'
      ? 'rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container'
      : 'rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase text-on-tertiary-fixed',
  }))

  const inventorySnapshots = [
    { id: 'books', label: 'Textbooks', count: `${Number(snap.booksStock ?? 0).toLocaleString()} In Stock`, icon: 'auto_stories' },
    { id: 'uniforms', label: 'Uniforms', count: `${Number(snap.uniformsStock ?? 0).toLocaleString()} In Stock`, icon: 'checkroom' },
  ]

  return (
    <>
      <div className="mb-12">
        <h2 className="headline mb-2 text-4xl font-extrabold tracking-tight">Sales Overview</h2>
        <p className="font-medium text-on-surface-variant">
          Monitoring kit distribution and daily desk performance.
        </p>
      </div>
      <section className="mb-12 flex flex-col items-center justify-center rounded-[2rem] bg-surface-container-lowest py-12 shadow-sm">
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-xl font-bold">Ready for the next customer?</h3>
          <p className="text-sm text-on-surface-variant">
            Process a new kit sale or student equipment request in seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(paths.ordersNew)}
          className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-5 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" aria-hidden>add_shopping_cart</span>
          <span>+ New Order</span>
        </button>
      </section>
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {salesStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="headline text-xl font-bold">Recent Transactions</h3>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 && (
              <p className="text-sm text-on-surface-variant">No transactions yet today.</p>
            )}
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-[2rem] bg-[#005da7] p-8 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />
            <div className="absolute left-10 top-20 h-20 w-20 rounded-full bg-white/5 blur-2xl" aria-hidden />
            <div className="relative z-10">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                Quick Action
              </span>
              <h4 className="mb-4 text-2xl font-bold leading-tight">
                Start a new order for a student
              </h4>
              <button
                type="button"
                onClick={() => navigate(paths.ordersNew)}
                className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-[#005da7] transition-all hover:bg-opacity-90"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inventorySnapshots.map((row) => (
          <InventoryCard key={row.id} item={row} />
        ))}
      </div>
    </>
  )
}
