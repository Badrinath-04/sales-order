import { Navigate } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'

/**
 * Sends the user to the first screen they’re allowed to see inside /admin/* or /senior/* shells.
 */
export default function BranchShellSmartRedirect({ segment }) {
  const base = `/${segment}`
  const canDash = usePermission('canViewDashboard')
  const canReports = usePermission('canViewReports')
  const canOrders = usePermission('canPlaceOrders')
  const canTx = usePermission('canViewTransactions')
  const canInv = usePermission('canUpdateStock')
  const canManageAccounts = usePermission('canManageAccounts')
  const canManagePublishers = usePermission('canManagePublishers')
  const canViewPublisherFinancials = usePermission('canViewPublisherFinancials')
  const canAcct = canManageAccounts || canManagePublishers || canViewPublisherFinancials
  const canSettings = usePermission('canViewSettings')

  if (canDash) return <Navigate to={`${base}/dashboard`} replace />
  if (canReports) return <Navigate to={`${base}/reports`} replace />
  if (canOrders) return <Navigate to={`${base}/orders/new`} replace />
  if (canTx) return <Navigate to={`${base}/transactions`} replace />
  if (canInv) return <Navigate to={`${base}/inventory`} replace />
  if (canAcct) return <Navigate to={`${base}/accounts`} replace />
  if (segment === 'admin' && canSettings) return <Navigate to={`${base}/settings`} replace />
  return <Navigate to="/login" replace />
}
