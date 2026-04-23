import { createContext } from 'react'
import { ROLES } from '../config/navigation'

export const AdminSessionContext = createContext({
  role: ROLES.ADMIN,
})
