import { Navigate, Route } from 'react-router-dom'
import Inventory from '@/features/inventory'
import NewOrderSelection from '@/features/orders/new-order'
import OrderConfiguration from '@/features/orders/config'
import OrderPayment from '@/features/orders/payment'
import Transactions from '@/features/transactions'
import TransactionDetail from '@/features/transactions/detail'
import { SeniorAdminShellGuard } from '@/routing/ShellGuards'
import AdminDashboard from '@/features/admin/dashboard'

export const seniorAdminShellRouteTree = (
  <Route path="senior" element={<SeniorAdminShellGuard />}>
    <Route index element={<Navigate to="dashboard" replace relative="path" />} />
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="inventory" element={<Inventory />} />
    <Route path="orders/new" element={<NewOrderSelection />} />
    <Route path="orders/configure" element={<OrderConfiguration />} />
    <Route path="orders/payment" element={<OrderPayment />} />
    <Route path="transactions/:id" element={<TransactionDetail />} />
    <Route path="transactions" element={<Transactions />} />
  </Route>
)
