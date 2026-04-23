import { useMemo, useState } from 'react'
import { ROLES } from '@/config/navigation'
import { AdminSessionContext } from './adminSessionContext'

const STORAGE_KEY = 'skm_role'

function readStoredRole() {
  if (typeof window === 'undefined') return ROLES.ADMIN
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === ROLES.SUPER_ADMIN || raw === ROLES.ADMIN) return raw
  } catch {
    /* ignore */
  }
  return ROLES.ADMIN
}

export default function AdminSessionProviderRoot({ children }) {
  const [role] = useState(readStoredRole)

  const value = useMemo(() => ({ role }), [role])

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}
