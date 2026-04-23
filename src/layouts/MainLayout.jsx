import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import Topbar from '@/components/Topbar'

export default function MainLayout() {
  const { pathname } = useLocation()
  /** Sidebar follows URL shell so admin routes never show the super-admin menu (e.g. Sales/Reports). */
  const isSuperShell = pathname.startsWith('/super')

  const isInventory =
    pathname.startsWith('/super/stock') || pathname.startsWith('/admin/inventory')
  const isOrdersShell =
    pathname.startsWith('/super/sales/orders/new') ||
    pathname.startsWith('/super/sales/orders/configure') ||
    pathname.startsWith('/super/sales/orders/payment') ||
    pathname.startsWith('/admin/orders')
  const isTransactionDetail =
    /^\/super\/transactions\/.+/.test(pathname) || /^\/admin\/transactions\/.+/.test(pathname)
  const hideShellTopbar = isInventory || isOrdersShell || isTransactionDetail

  return (
    <div className="min-h-full bg-surface text-on-surface font-body">
      {isSuperShell ? <SuperAdminSidebar /> : <AdminSidebar />}
      {!hideShellTopbar ? <Topbar /> : null}
      <main
        className={
          hideShellTopbar
            ? 'ml-64 min-h-screen bg-surface'
            : 'ml-64 min-h-screen bg-surface pb-12 pl-8 pr-8 pt-24'
        }
      >
        <Outlet />
      </main>
    </div>
  )
}
