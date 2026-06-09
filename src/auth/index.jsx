import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'
import './styles.scss'

function getDefaultHome(role) {
  if (role === ROLES.SUPER_ADMIN) return '/super/dashboard'
  if (role === ROLES.SENIOR_ADMIN) return '/senior'
  return '/admin'
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role, login } = useAdminSession()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect already-authenticated users to their dashboard
  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super/dashboard" replace />
  if (role === ROLES.ADMIN) return <Navigate to="/admin" replace />
  if (role === ROLES.SENIOR_ADMIN) return <Navigate to="/senior" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const data = new FormData(e.currentTarget)
    try {
      const loggedRole = await login(
        String(data.get('email') ?? ''),
        String(data.get('password') ?? ''),
      )
      if (!loggedRole) { setError('Invalid credentials.'); return }

      // Honour the ?redirect= param so deep-link access flows work
      const redirectTo = searchParams.get('redirect')
      const defaultHome = getDefaultHome(loggedRole)
      // Only allow redirect to same-origin paths (no open redirect)
      const safePath = redirectTo && redirectTo.startsWith('/') ? redirectTo : defaultHome
      navigate(safePath, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message
      if (err?.request && !err?.response) {
        setError('Cannot reach the server. Check Wi‑Fi and that the dev machine is running.')
      } else if (status === 401 && typeof msg === 'string' && msg) {
        setError(msg)
      } else {
        setError('Invalid credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <h2 className="login__heading">Sign in</h2>
      <p className="login__sub">Use your campus credentials to sign in.</p>
      <form className="login__form" onSubmit={handleSubmit}>
        <label className="login__field">
          <span className="login__label">Username</span>
          <input
            className="login__input"
            type="text"
            name="email"
            autoComplete="username"
            placeholder="e.g. school_admin"
            required
          />
        </label>
        <label className="login__field">
          <span className="login__label">Password</span>
          <input
            className="login__input"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </label>
        {error && <p className="login__error" role="alert">{error}</p>}
        <button type="submit" className="login__submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
