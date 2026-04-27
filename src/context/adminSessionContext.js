import { createContext } from 'react'

export const AdminSessionContext = createContext({
  role: null,
  user: null,
  branchId: null,
  login: async () => null,
  logout: async () => {},
})
