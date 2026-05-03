import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ROLES } from '@/config/navigation'
import { authApi } from '@/services/api'
import { AdminSessionContext } from './adminSessionContext'

const INACTIVITY_MS = {
  [ROLES.SUPER_ADMIN]: 5 * 60 * 1000,
  [ROLES.SENIOR_ADMIN]: 10 * 60 * 1000,
  [ROLES.ADMIN]: 10 * 60 * 1000,
}

const TOKEN_KEY = 'skm_token'
const REFRESH_KEY = 'skm_refresh'
const ROLE_KEY = 'skm_role'
const USER_KEY = 'skm_user'
const KNOWN_PERMISSION_KEYS = [
  'canViewDashboard',
  'canViewReports',
  'canViewSettings',
  'canUpdateStock',
  'canAdjustStock',
  'canBulkEditStock',
  'canCreateProducts',
  'canViewStockLogs',
  'canPlaceOrders',
  'canManageStudents',
  'canBulkImport',
  'canResetStudentData',
  'canViewTransactions',
  'canViewRevenue',
  'canViewPublisherFinancials',
  'canManagePublishers',
  'canManageAccounts',
]

const ROLE_DEFAULT_PERMISSIONS = {
  [ROLES.SENIOR_ADMIN]: {
    canViewDashboard: true,
    canViewReports: true,
    canViewSettings: true,
    canUpdateStock: true,
    canAdjustStock: false,
    canBulkEditStock: false,
    canCreateProducts: false,
    canViewStockLogs: false,
    canPlaceOrders: true,
    canManageStudents: true,
    canBulkImport: false,
    canResetStudentData: false,
    canViewTransactions: false,
    canViewRevenue: false,
    canViewPublisherFinancials: false,
    canManagePublishers: false,
    canManageAccounts: false,
  },
  [ROLES.ADMIN]: {
    canViewDashboard: true,
    canViewReports: true,
    canViewSettings: true,
    canUpdateStock: false,
    canAdjustStock: false,
    canBulkEditStock: false,
    canCreateProducts: false,
    canViewStockLogs: false,
    canPlaceOrders: true,
    canManageStudents: true,
    canBulkImport: false,
    canResetStudentData: false,
    canViewTransactions: true,
    canViewRevenue: true,
    canViewPublisherFinancials: false,
    canManagePublishers: false,
    canManageAccounts: false,
  },
}

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
    if (raw === ROLES.SUPER_ADMIN || raw === ROLES.SENIOR_ADMIN || raw === ROLES.ADMIN) return raw
  } catch { /* ignore */ }
  return null
}

function readStoredUser() {
  try {
    const raw = readStorage(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function normalizePermissions(raw, role) {
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? {}
  let source = raw
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source)
    } catch {
      source = null
    }
  }
  if (!source || typeof source !== 'object') return defaults
  const mergedSource = { ...source }
  if (
    typeof mergedSource.canViewSales === 'boolean' &&
    typeof mergedSource.canViewReports === 'undefined'
  ) {
    mergedSource.canViewReports = mergedSource.canViewSales
  }
  const normalized = { ...defaults }
  for (const key of KNOWN_PERMISSION_KEYS) {
    if (typeof mergedSource[key] !== 'undefined') normalized[key] = Boolean(mergedSource[key])
  }
  return normalized
}

export default function AdminSessionProviderRoot({ children }) {
  const [role, setRole] = useState(readStoredRole)
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password)
    const { token, refreshToken, user: u } = data.data

    const mappedRole =
      u.role === 'SUPER_ADMIN' ? ROLES.SUPER_ADMIN :
      u.role === 'SENIOR_ADMIN' ? ROLES.SENIOR_ADMIN :
      ROLES.ADMIN
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

  const inactivityTimer = useRef(null)

  useEffect(() => {
    if (!role) return
    const timeout = INACTIVITY_MS[role]
    if (!timeout) return

    const reset = () => {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(() => logout(), timeout)
    }

    const events = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(inactivityTimer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [role, logout])

  useEffect(() => {
    const token = readStorage(TOKEN_KEY)
    if (!token) return
    let cancelled = false
    authApi.me()
      .then(({ data }) => {
        const u = data?.data
        if (!u || cancelled) return
        writeStorage(USER_KEY, JSON.stringify(u))
        setUser(u)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const normalizedPermissions = useMemo(
    () => normalizePermissions(user?.permissions ?? null, role),
    [user?.permissions, role],
  )

  const value = useMemo(
    () => ({ role, user, branchId: user?.branch?.id, permissions: normalizedPermissions, login, logout }),
    [role, user, normalizedPermissions, login, logout],
  )

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}
