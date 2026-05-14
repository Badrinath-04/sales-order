import { Navigate, useParams } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function LegacyTransactionDetailRedirect() {
  const { id } = useParams()
  const { role } = useAdminSession()
  const base = role === ROLES.SUPER_ADMIN ? '/super/transactions' : '/admin/transactions'
  return <Navigate to={`${base}/${id}`} replace />
}
