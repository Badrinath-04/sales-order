import { ROLES } from '@/config/navigation'

/** Static demo accounts for local / staging UI only. */
const ACCOUNTS = [
  { username: 'school_admin', password: 'admin123', role: ROLES.ADMIN },
  { username: 'super_admin', password: 'super123', role: ROLES.SUPER_ADMIN },
]

/**
 * @param {string} username
 * @param {string} password
 * @returns {{ role: string } | null}
 */
export function matchDemoLogin(username, password) {
  const u = String(username).trim().toLowerCase()
  const p = String(password)
  const row = ACCOUNTS.find((a) => a.username.toLowerCase() === u && a.password === p)
  return row ? { role: row.role } : null
}
