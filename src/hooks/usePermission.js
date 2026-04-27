import { useAdminSession } from '@/context/useAdminSession'
import { ROLES } from '@/config/navigation'

export function usePermission(flag) {
  const { role, permissions } = useAdminSession()
  if (role === ROLES.SUPER_ADMIN) return true
  if (!permissions) return false
  return Boolean(permissions[flag])
}
