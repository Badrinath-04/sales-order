import { createContext } from 'react'

export const AdminSessionContext = createContext({
  role: null,
  user: null,
  branchId: null,
  permissions: {},
  permissionsReady: true,
  login: async () => null,
  logout: async () => {},
})
