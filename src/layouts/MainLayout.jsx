import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import SeniorAdminSidebar from '@/components/SeniorAdminSidebar'
import Topbar from '@/components/Topbar'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function LayoutShell() {
  const { pathname } = useLocation()
  const { isOpen, close } = useSidebar()

  const isSuperShell = pathname.startsWith('/super')
  const isSeniorShell = pathname.startsWith('/senior')

  const isInventory =
    pathname.startsWith('/super/stock') ||
    pathname.startsWith('/admin/inventory') ||
    pathname.startsWith('/senior/inventory')
  const isOrdersShell =
    pathname.startsWith('/super/orders/new') ||
    pathname.startsWith('/super/orders/configure') ||
    pathname.startsWith('/super/orders/payment') ||
    pathname.startsWith('/admin/orders') ||
    pathname.startsWith('/senior/orders')
  const isTransactionDetail =
    /^\/super\/transactions\/.+/.test(pathname) ||
    /^\/admin\/transactions\/.+/.test(pathname) ||
    /^\/senior\/transactions\/.+/.test(pathname)
  const hideShellTopbar = isInventory || isOrdersShell || isTransactionDetail

  const Sidebar = isSuperShell ? SuperAdminSidebar : isSeniorShell ? SeniorAdminSidebar : AdminSidebar

  const shellMainClass = hideShellTopbar
    ? isInventory
      ? 'lg:ml-64 h-screen overflow-hidden bg-surface'
      : 'lg:ml-64 min-h-screen bg-surface'
    : 'lg:ml-64 min-h-screen bg-surface pb-12 px-4 md:px-8 pt-20 lg:pt-24'

  return (
    <div className="min-h-full bg-surface text-on-surface font-body">
      <Sidebar />
      {!hideShellTopbar ? <Topbar /> : null}
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <main className={shellMainClass}>
        <Outlet />
      </main>
    </div>
  )
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <LayoutShell />
    </SidebarProvider>
  )
}
