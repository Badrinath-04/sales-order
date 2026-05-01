import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { useSidebar } from '@/context/SidebarContext'
import { usePermission } from '@/hooks/usePermission'

const baseLinkClass =
  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium group'

function navClassName({ isActive }) {
  if (isActive) {
    return `${baseLinkClass} bg-white/50 text-primary dark:text-primary-container font-bold`
  }
  return `${baseLinkClass} hover:bg-[#fbf9f8] dark:hover:bg-slate-800 text-[#1b1c1c]/60 dark:text-slate-400`
}

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAdminSession()
  const { isOpen, close } = useSidebar()
  const canViewDashboard = usePermission('canViewDashboard')
  const canViewReports = usePermission('canViewReports')
  const canViewSettings = usePermission('canViewSettings')
  const canUpdateStock = usePermission('canUpdateStock')
  const canPlaceOrders = usePermission('canPlaceOrders')
  const canViewTransactions = usePermission('canViewTransactions')
  const canManageAccounts = usePermission('canManageAccounts')
  const canManagePublishers = usePermission('canManagePublishers')
  const canViewPublisherFinancials = usePermission('canViewPublisherFinancials')

  const items = [
    canViewDashboard && { id: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard', end: true },
    canViewReports && {
      id: 'reports',
      label: 'Reports',
      to: '/admin/reports',
      icon: 'insert_chart',
      activePrefix: '/admin/reports',
    },
    canPlaceOrders && {
      id: 'new-order',
      label: 'New Order',
      to: '/admin/orders/new',
      icon: 'add_shopping_cart',
      activePrefix: '/admin/orders',
    },
    canUpdateStock && { id: 'inventory', label: 'Inventory', to: '/admin/inventory', icon: 'inventory_2' },
    canViewTransactions && {
      id: 'transactions',
      label: 'Transactions',
      to: '/admin/transactions',
      icon: 'receipt_long',
      activePrefix: '/admin/transactions',
    },
    (canManageAccounts || canManagePublishers || canViewPublisherFinancials) && {
      id: 'accounts',
      label: 'Accounts',
      to: '/admin/accounts',
      icon: 'account_balance_wallet',
      activePrefix: '/admin/accounts',
    },
    canViewSettings && { id: 'settings', label: 'Settings', to: '/admin/settings', icon: 'settings', end: true },
  ].filter(Boolean)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#f6f3f2] p-6 dark:bg-slate-900 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#1b1c1c] dark:text-slate-100">
            School Kit Manager
          </h1>
          <p className="text-xs font-medium text-[#1b1c1c]/60 dark:text-slate-400">Admin Terminal</p>
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 hover:bg-black/5 lg:hidden"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-xl text-[#1b1c1c]/60" aria-hidden>close</span>
        </button>
      </div>
      <nav className="flex flex-grow flex-col gap-2" aria-label="School admin">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={close}
            className={({ isActive }) =>
              navClassName({
                isActive: item.activePrefix ? pathname.startsWith(item.activePrefix) : isActive,
              })
            }
            end={Boolean(item.end)}
          >
            {({ isActive: navIsActive }) => {
              const isActive = item.activePrefix ? pathname.startsWith(item.activePrefix) : navIsActive
              return (
                <>
                  <span
                    className={`material-symbols-outlined${
                      isActive && item.activeIconFill ? ' material-symbols-outlined--fill' : ''
                    }`}
                    data-icon={item.icon}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span className="font-label">{item.label}</span>
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-outline-variant/20 pt-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary font-bold text-sm">
            {user?.displayName?.[0] ?? 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{user?.displayName ?? 'Admin'}</span>
            <span className="text-xs opacity-60 truncate">{user?.branch?.name ?? 'Branch'}</span>
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
