import { Navigate } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function RootHomeRedirect() {
  const { role } = useAdminSession()
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.SENIOR_ADMIN) return <Navigate to="/senior/dashboard" replace />
  return <Navigate to="/admin/dashboard" replace />
}

export function NavigateByRole({ adminTo, superTo, seniorTo }) {
  const { role } = useAdminSession()
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to={superTo} replace />
  if (role === ROLES.SENIOR_ADMIN) return <Navigate to={seniorTo ?? adminTo} replace />
  return <Navigate to={adminTo} replace />
}
