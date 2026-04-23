import { Navigate } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function RootHomeRedirect() {
  const { role } = useAdminSession()
  const to = role === ROLES.SUPER_ADMIN ? '/super/dashboard' : '/admin/dashboard'
  return <Navigate to={to} replace />
}

export function NavigateByRole({ adminTo, superTo }) {
  const { role } = useAdminSession()
  return <Navigate to={role === ROLES.SUPER_ADMIN ? superTo : adminTo} replace />
}
