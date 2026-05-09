/**
 * useAuthGuard — secondary client-side auth gate.
 *
 * Call at the top of any protected layout or page component.
 * Redirects to /login when the local access token is expired or absent.
 *
 * The PRIMARY protection is:
 *   1. The ShellGuards (role-based React Router gates).
 *   2. The server-side JWT middleware on every API route.
 * This hook is a UX safety net so the user is not stuck on a broken blank page
 * when their token expires mid-session.
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'

export function useAuthGuard() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isAuthenticated()) {
      const redirectParam = encodeURIComponent(pathname)
      navigate(`/login?redirect=${redirectParam}`, { replace: true })
    }
  }, [navigate, pathname])
}
