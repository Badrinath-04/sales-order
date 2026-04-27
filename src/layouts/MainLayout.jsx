import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import SeniorAdminSidebar from '@/components/SeniorAdminSidebar'
import Topbar from '@/components/Topbar'

export default function MainLayout() {
  const { pathname } = useLocation()

  const isSuperShell = pathname.startsWith('/super')
  const isSeniorShell = pathname.startsWith('/senior')

  const isInventory =
    pathname.startsWith('/super/stock') ||
    pathname.startsWith('/admin/inventory') ||
    pathname.startsWith('/senior/inventory')
  const isOrdersShell =
    pathname.startsWith('/super/sales/orders/new') ||
    pathname.startsWith('/super/sales/orders/configure') ||
    pathname.startsWith('/super/sales/orders/payment') ||
    pathname.startsWith('/admin/orders') ||
    pathname.startsWith('/senior/orders')
  const isTransactionDetail =
    /^\/super\/transactions\/.+/.test(pathname) ||
    /^\/admin\/transactions\/.+/.test(pathname) ||
    /^\/senior\/transactions\/.+/.test(pathname)
  const hideShellTopbar = isInventory || isOrdersShell || isTransactionDetail

  const Sidebar = isSuperShell ? SuperAdminSidebar : isSeniorShell ? SeniorAdminSidebar : AdminSidebar

  return (
    <div className="min-h-full bg-surface text-on-surface font-body">
      <Sidebar />
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
