import { useAdminSession } from '@/context/useAdminSession'
import { ROLES } from '@/config/navigation'

export function usePermission(flag) {
  const { role, permissions } = useAdminSession()
  if (role === ROLES.SUPER_ADMIN) return true
  if (!permissions || typeof permissions !== 'object') return false
  if (flag === 'canViewReports') {
    return Boolean(permissions.canViewReports ?? permissions.canViewSales)
  }
  return Boolean(permissions?.[flag])
}
