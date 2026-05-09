import { Navigate, Outlet } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

/** Shown while the initial /auth/me call is in-flight to avoid premature redirects. */
function SessionLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-on-surface-variant">Loading session…</p>
      </div>
    </div>
  )
}

export function AdminShellGuard() {
  const { role, permissionsReady } = useAdminSession()
  if (!permissionsReady) return <SessionLoadingScreen />
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.SENIOR_ADMIN) return <Navigate to="/senior/dashboard" replace />
  if (role !== ROLES.ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}

export function SuperAdminShellGuard() {
  const { role, permissionsReady } = useAdminSession()
  if (!permissionsReady) return <SessionLoadingScreen />
  if (!role) return <Navigate to="/login" replace />
  if (role !== ROLES.SUPER_ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}

export function SeniorAdminShellGuard() {
  const { role, permissionsReady } = useAdminSession()
  if (!permissionsReady) return <SessionLoadingScreen />
  if (!role) return <Navigate to="/login" replace />
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />
  if (role !== ROLES.SENIOR_ADMIN) return <Navigate to="/login" replace />
  return <Outlet />
}
