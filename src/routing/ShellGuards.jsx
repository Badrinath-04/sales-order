import { Navigate, Outlet } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function AdminShellGuard() {
  const { role } = useAdminSession()
  if (role !== ROLES.ADMIN) return <Navigate to="/super/dashboard" replace />
  return <Outlet />
}

export function SuperAdminShellGuard() {
  const { role } = useAdminSession()
  if (role !== ROLES.SUPER_ADMIN) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}
