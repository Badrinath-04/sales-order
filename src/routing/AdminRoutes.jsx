import { Navigate, Route } from 'react-router-dom'
import AdminModulePlaceholder from '@/components/AdminModulePlaceholder'
import AdminDashboard from '@/features/admin/dashboard'
import Settings from '@/features/admin/settings'
import Inventory from '@/features/inventory'
import NewOrderSelection from '@/features/orders/new-order'
import OrderConfiguration from '@/features/orders/config'
import OrderPayment from '@/features/orders/payment'
import Transactions from '@/features/transactions'
import TransactionDetail from '@/features/transactions/detail'
import { AdminShellGuard } from '@/routing/ShellGuards'

/** Route element tree (not a component) so parent `<Routes>` registers nested routes. */
export const adminShellRouteTree = (
  <Route path="admin" element={<AdminShellGuard />}>
    <Route index element={<Navigate to="dashboard" replace relative="path" />} />
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="inventory" element={<Inventory />} />
    <Route path="orders" element={<NewOrderSelection />} />
    <Route path="orders/new" element={<NewOrderSelection />} />
    <Route path="orders/configure" element={<OrderConfiguration />} />
    <Route path="orders/payment" element={<OrderPayment />} />
    <Route path="settings" element={<Settings />} />
    <Route
      path="reports"
      element={
        <AdminModulePlaceholder
          title="Reports"
          description="School-level reporting and exports will live here."
        />
      }
    />
    <Route
      path="sales"
      element={
        <AdminModulePlaceholder
          title="Sales"
          description="Campus sales summaries will live here."
        />
      }
    />
    <Route path="transactions/:id" element={<TransactionDetail />} />
    <Route path="transactions" element={<Transactions />} />
  </Route>
)
