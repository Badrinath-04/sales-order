import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { useSidebar } from '@/context/SidebarContext'
import { usePermission } from '@/hooks/usePermission'

const baseLinkClass =
  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium group'

function navClassName({ isActive }) {
  if (isActive) return `${baseLinkClass} bg-white/50 text-primary font-bold`
  return `${baseLinkClass} hover:bg-[#fbf9f8] text-[#1b1c1c]/60`
}

export default function SeniorAdminSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAdminSession()
  const { isOpen, close, dismiss, isDesktopCollapsed } = useSidebar()
  const canViewDashboard = usePermission('canViewDashboard')
  const canViewReports = usePermission('canViewReports')
  const canUpdateStock = usePermission('canUpdateStock')
  const canViewUniformStock = usePermission('canViewUniformStock')
  const canPlaceOrders = usePermission('canPlaceOrders')
  const canCreateUniformOrders = usePermission('canCreateUniformOrders')
  const canViewStudentList = usePermission('canViewStudentList')
  const canBulkImport = usePermission('canBulkImport')
  const canViewSettings = usePermission('canViewSettings')
  const canViewTransactions7Days = usePermission('canViewTransactions7Days')
  const canViewTransactionsAllTime = usePermission('canViewTransactionsAllTime')
  const canManageAccounts = usePermission('canManageAccounts')
  const canManagePublishers = usePermission('canManagePublishers')
  const canViewPublisherFinancials = usePermission('canViewPublisherFinancials')
  const canViewAdmissions = usePermission('canViewAdmissions')
  const canViewExpenses = usePermission('canViewExpenses')

  const items = [
    canViewDashboard && { id: 'dashboard', label: 'Dashboard', to: '/senior/dashboard', icon: 'dashboard', end: true },
    canViewReports && {
      id: 'reports',
      label: 'Reports',
      to: '/senior/reports',
      icon: 'insert_chart',
      activePrefix: '/senior/reports',
    },
    (canPlaceOrders || canCreateUniformOrders || canViewStudentList) && {
      id: 'new-order',
      label: 'New Order',
      to: '/senior/orders/new',
      icon: 'add_shopping_cart',
      activePrefix: '/senior/orders',
    },
    canViewAdmissions && {
      id: 'admissions',
      label: 'New Admissions',
      to: '/senior/admissions',
      icon: 'person_add',
      activePrefix: '/senior/admissions',
    },
    canViewExpenses && {
      id: 'expenses',
      label: 'Cash',
      to: '/senior/expenses',
      icon: 'payments',
      activePrefix: '/senior/expenses',
    },
    canBulkImport && { id: 'bulk-import', label: 'Bulk Import', to: '/senior/bulk-import', icon: 'upload_file' },
    (canUpdateStock || canViewUniformStock) && { id: 'inventory', label: 'Inventory', to: '/senior/inventory', icon: 'inventory_2' },
    (canViewTransactions7Days || canViewTransactionsAllTime) && {
      id: 'transactions',
      label: 'Transactions',
      to: '/senior/transactions',
      activePrefix: '/senior/transactions',
      icon: 'receipt_long',
    },
    canViewSettings && { id: 'settings', label: 'Settings', to: '/senior/settings', icon: 'settings', end: true },
    (canManageAccounts || canManagePublishers || canViewPublisherFinancials) && {
      id: 'accounts',
      label: 'Accounts',
      to: '/senior/accounts',
      icon: 'account_balance_wallet',
      activePrefix: '/senior/accounts',
    },
  ].filter(Boolean)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#f6f3f2] p-6 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isDesktopCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}
    >
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#1b1c1c]">School Kit Manager</h1>
          <p className="text-xs font-medium text-[#1b1c1c]/60">Operations Admin</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1.5 hover:bg-black/5"
          aria-label="Close sidebar"
        >
          <span className="material-symbols-outlined text-xl text-[#1b1c1c]/60" aria-hidden>close</span>
        </button>
      </div>
      <nav className="flex flex-grow flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={close}
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
