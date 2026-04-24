import { useCallback, useMemo, useState } from 'react'
import { ROLES } from '@/config/navigation'
import { authApi } from '@/services/api'
import { AdminSessionContext } from './adminSessionContext'

const TOKEN_KEY = 'skm_token'
const REFRESH_KEY = 'skm_refresh'
const ROLE_KEY = 'skm_role'
const USER_KEY = 'skm_user'

function readStorage(key) {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(key) } catch { return null }
}

function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value) } catch { /* ignore */ }
}

function clearStorage() {
  try {
    [TOKEN_KEY, REFRESH_KEY, ROLE_KEY, USER_KEY].forEach((k) => window.localStorage.removeItem(k))
  } catch { /* ignore */ }
}

function readStoredRole() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ROLE_KEY)
    if (raw === ROLES.SUPER_ADMIN || raw === ROLES.ADMIN) return raw
  } catch { /* ignore */ }
  return null
}

function readStoredUser() {
  try {
    const raw = readStorage(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function AdminSessionProviderRoot({ children }) {
  const [role, setRole] = useState(readStoredRole)
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password)
    const { token, refreshToken, user: u } = data.data

    const mappedRole = u.role === 'SUPER_ADMIN' ? ROLES.SUPER_ADMIN : ROLES.ADMIN
    writeStorage(TOKEN_KEY, token)
    writeStorage(REFRESH_KEY, refreshToken)
    writeStorage(ROLE_KEY, mappedRole)
    writeStorage(USER_KEY, JSON.stringify(u))

    setRole(mappedRole)
    setUser(u)
    return mappedRole
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = readStorage(REFRESH_KEY)
    try { await authApi.logout(refreshToken) } catch { /* ignore */ }
    clearStorage()
    setRole(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ role, user, branchId: user?.branch?.id, login, logout }),
    [role, user, login, logout],
  )

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}
