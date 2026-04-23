import { useMemo } from 'react'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/AdminSessionProvider'

export function useShellPaths() {
  const { role } = useAdminSession()

  return useMemo(() => {
    if (role === ROLES.SUPER_ADMIN) {
      return {
        dashboard: '/super/dashboard',
        stock: '/super/stock',
        sales: '/super/sales',
        reports: '/super/reports',
        transactions: '/super/transactions',
        transactionDetail: (id) => `/super/transactions/${id}`,
        ordersNew: '/super/sales/orders/new',
        ordersConfigure: '/super/sales/orders/configure',
        ordersPayment: '/super/sales/orders/payment',
      }
    }
    return {
      dashboard: '/admin/dashboard',
      stock: '/admin/inventory',
      sales: '/admin/sales',
      reports: '/admin/reports',
      settings: '/admin/settings',
      transactions: '/admin/transactions',
      transactionDetail: (id) => `/admin/transactions/${id}`,
      ordersNew: '/admin/orders/new',
      ordersConfigure: '/admin/orders/configure',
      ordersPayment: '/admin/orders/payment',
      ordersHub: '/admin/orders',
    }
  }, [role])
}
