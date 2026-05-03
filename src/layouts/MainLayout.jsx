import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import SeniorAdminSidebar from '@/components/SeniorAdminSidebar'
import Topbar from '@/components/Topbar'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function LayoutShell() {
  const { pathname } = useLocation()
  const { isOpen, close, isDesktopCollapsed } = useSidebar()

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

  // Use padding (not margin) for the desktop sidebar offset. When the sidebar is collapsed on lg+, skip pl-64.
  const lgPad = isDesktopCollapsed ? '' : 'lg:pl-64'
  const shellMainClass = hideShellTopbar
    ? isInventory
      ? `flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden bg-surface ${lgPad}`
      : `w-full min-w-0 min-h-screen bg-surface ${lgPad}`
    : `w-full min-w-0 min-h-screen bg-surface pb-12 px-4 pt-20 md:px-8 lg:pt-24 ${lgPad}`

  return (
    <div className="min-h-full w-full bg-surface text-on-surface font-body">
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
