/**
 * Client-side auth utilities.
 *
 * NOTE: These utilities only provide defence-in-depth / UX helpers.
 * The definitive security boundary is the backend JWT middleware (src/middleware/auth.js).
 * Never trust client-side checks as the sole protection.
 */

const TOKEN_KEY = 'skm_token'
const REFRESH_KEY = 'skm_refresh'
const ROLE_KEY = 'skm_role'
const USER_KEY = 'skm_user'

/** Decode the payload section of a JWT without verifying the signature. */
export function decodeJWTPayload(token) {
  try {
    const parts = String(token ?? '').split('.')
    if (parts.length < 2) return null
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
      parts[1].length + ((4 - (parts[1].length % 4)) % 4),
      '=',
    )
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/**
 * Returns true if the access token exists and has not expired.
 * Does NOT verify the signature — that is the server's job.
 */
export function isAuthenticated() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false
    const payload = decodeJWTPayload(token)
    if (!payload?.exp) return false
    // Allow a 30-second clock-skew buffer
    return (Date.now() / 1000) < (payload.exp - 30)
  } catch {
    return false
  }
}

/** Return the stored role string (e.g. 'super_admin') or null. */
export function getStoredRole() {
  try { return localStorage.getItem(ROLE_KEY) } catch { return null }
}

/**
 * Clear all auth-related keys from localStorage.
 * Call this on logout or when a 401 is received.
 */
export function clearAuthStorage() {
  try {
    [TOKEN_KEY, REFRESH_KEY, ROLE_KEY, USER_KEY].forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

/**
 * Returns the default dashboard path for a given role slug.
 * Role slugs match the ROLES constants in @/config/navigation.js.
 */
export function getDefaultDashboard(role) {
  const map = {
    super_admin: '/super/dashboard',
    senior_admin: '/senior/dashboard',
    admin: '/admin/dashboard',
  }
  return map[role] ?? '/login'
}
