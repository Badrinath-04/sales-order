import { useAdminSession } from '@/context/useAdminSession'
import { ROLES } from '@/config/navigation'

export function usePermission(flag) {
  const { role, permissions } = useAdminSession()
  if (role === ROLES.SUPER_ADMIN) return true
  if (!permissions || typeof permissions !== 'object') return false
  if (flag === 'canViewReports') {
    return Boolean(permissions.canViewReports ?? permissions.canViewSales)
  }
  if (flag === 'canViewTransactionsAllTime') {
    return Boolean(permissions.canViewTransactionsAllTime ?? permissions.canViewTransactions)
  }
  return Boolean(permissions?.[flag])
}

export function useAnyPermission(flags) {
  const { role, permissions } = useAdminSession()
  if (role === ROLES.SUPER_ADMIN) return true
  if (!permissions || typeof permissions !== 'object') return false
  return flags.some((flag) => {
    if (flag === 'canViewReports') return Boolean(permissions.canViewReports ?? permissions.canViewSales)
    if (flag === 'canViewTransactionsAllTime') return Boolean(permissions.canViewTransactionsAllTime ?? permissions.canViewTransactions)
    return Boolean(permissions?.[flag])
  })
}
