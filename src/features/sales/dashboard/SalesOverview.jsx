import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import StatCard from './components/StatCard'
import TransactionItem from './components/TransactionItem'
import InventoryCard from './components/InventoryCard'
import { inventorySnapshots, recentTransactions, salesStats } from './data'
import './styles.scss'

export default function SalesOverview() {
  const navigate = useNavigate()
  const paths = useShellPaths()

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
          <span className="material-symbols-outlined" data-icon="add_shopping_cart" aria-hidden>
            add_shopping_cart
          </span>
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
            <button type="button" className="text-sm font-bold text-primary hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
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
                Quick Insight
              </span>
              <h4 className="mb-4 text-2xl font-bold leading-tight">
                Stock Alert: Grade 7 Math Kits are running low (5 remaining).
              </h4>
              <button
                type="button"
                className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-[#005da7] transition-all hover:bg-opacity-90"
              >
                Order More
              </button>
            </div>
            <img
              alt="Dashboard Aesthetic Background"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxWTNCqDoS-Q6ZQCz1DAsmdeF4tYjZC6SATRod9sWy8xRf1WsHWS1k4LqntlvU7SHWNALtVB62I_oN4rivco88tKQDOaexLk97rK2Ye38q-Dws3LhnyLM0EjuxN2dtrBGG5FiNfps-VFSo8scTWvlJSn8dTqG8MoYm9kesfOr_p8uxlgXQjYq7bjZNSAywYISHILKmT2i8Rf1qnkxvQj2yuSW0FBBvoWD9vezz9Lyxr7szQdGLnW7yROTJtA1D_WRRZUONJHpuD-0"
            />
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
