import { useContext } from 'react'
import { AdminSessionContext } from './adminSessionContext'

export function useAdminSession() {
  return useContext(AdminSessionContext)
}
