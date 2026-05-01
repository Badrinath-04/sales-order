import { Navigate, Outlet } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function AdminShellGuard() {
  const { role } = useAdminSession()
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.SENIOR_ADMIN) return <Navigate to="/senior/dashboard" replace />
  if (role !== ROLES.ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}

export function SuperAdminShellGuard() {
  const { role } = useAdminSession()
  if (!role) return <Navigate to="/login" replace />
  if (role !== ROLES.SUPER_ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}

export function SeniorAdminShellGuard() {
  const { role } = useAdminSession()
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />
  if (role !== ROLES.SENIOR_ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}
