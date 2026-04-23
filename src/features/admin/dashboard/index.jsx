import { useNavigate } from 'react-router-dom'
import DashboardHeader from './components/DashboardHeader'
import InventorySnapshot from './components/InventorySnapshot'
import KPISection from './components/KPISection'
import TransactionsList from './components/TransactionsList'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="font-body text-on-surface">
      <DashboardHeader />

      <section className="mb-12 flex flex-col items-center justify-center rounded-[2rem] bg-surface-container-lowest py-12 shadow-sm">
        <div className="mb-8 text-center">
          <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">Ready for the next customer?</h3>
          <p className="text-sm text-on-surface-variant">
            Process a new kit sale or student equipment request in seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/orders/new')}
          className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-container px-10 py-5 text-lg font-bold text-on-primary shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" data-icon="add_shopping_cart" aria-hidden>
            add_shopping_cart
          </span>
          <span>+ New Order</span>
        </button>
      </section>

      <KPISection />
      <TransactionsList />
      <InventorySnapshot />
    </div>
  )
}
