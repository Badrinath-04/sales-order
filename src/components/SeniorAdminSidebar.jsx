import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'

const baseLinkClass =
  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium group'

function navClassName({ isActive }) {
  if (isActive) return `${baseLinkClass} bg-white/50 text-primary font-bold`
  return `${baseLinkClass} hover:bg-[#fbf9f8] text-[#1b1c1c]/60`
}

const items = [
  { id: 'dashboard', label: 'Dashboard', to: '/senior/dashboard', icon: 'dashboard', end: true },
  { id: 'new-order', label: 'New Order', to: '/senior/orders/new', icon: 'add_shopping_cart', activePrefix: '/senior/orders' },
  { id: 'inventory', label: 'Inventory', to: '/senior/inventory', icon: 'inventory_2' },
  { id: 'transactions', label: 'Transactions', to: '/senior/transactions', activePrefix: '/senior/transactions', icon: 'receipt_long' },
]

export default function SeniorAdminSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAdminSession()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#f6f3f2] p-6">
      <div className="mb-10">
        <h1 className="text-lg font-bold tracking-tight text-[#1b1c1c]">School Kit Manager</h1>
        <p className="text-xs font-medium text-[#1b1c1c]/60">Operations Admin</p>
      </div>
      <nav className="flex flex-grow flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              navClassName({ isActive: item.activePrefix ? pathname.startsWith(item.activePrefix) : isActive })
            }
            end={Boolean(item.end)}
          >
            {({ isActive: navIsActive }) => {
              const isActive = item.activePrefix ? pathname.startsWith(item.activePrefix) : navIsActive
              return (
                <>
                  <span className="material-symbols-outlined" data-icon={item.icon} aria-hidden>{item.icon}</span>
                  <span className="font-label">{item.label}</span>
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-outline-variant/20 pt-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-on-secondary font-bold text-sm">
            {user?.displayName?.[0] ?? 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{user?.displayName ?? 'Senior Admin'}</span>
            <span className="text-xs opacity-60">{user?.branch?.name ?? 'Operations'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-error transition-colors hover:bg-error/5"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>logout</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
