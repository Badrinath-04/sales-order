import { Navigate, Route } from 'react-router-dom'
import Inventory from '@/features/inventory'
import NewOrderSelection from '@/features/orders/new-order'
import OrderConfiguration from '@/features/orders/config'
import OrderPayment from '@/features/orders/payment'
import Transactions from '@/features/transactions'
import TransactionDetail from '@/features/transactions/detail'
import SuperAdminDashboard from '@/features/super-admin/dashboard'
import SuperAdminSalesOverview from '@/features/super-admin/sales-overview'
import SuperAdminReports from '@/features/super-admin/reports'
import BulkImport from '@/features/super-admin/bulk-import'
import AdminManagement from '@/features/super-admin/admin-management'
import AccountsModule from '@/features/super-admin/accounts'
import { SuperAdminShellGuard } from '@/routing/ShellGuards'

/** Route element tree (not a component) so parent `<Routes>` registers nested routes. */
export const superAdminShellRouteTree = (
  <Route path="super" element={<SuperAdminShellGuard />}>
    <Route index element={<Navigate to="dashboard" replace relative="path" />} />
    <Route path="dashboard" element={<SuperAdminDashboard />} />
    <Route path="stock" element={<Inventory />} />
    <Route path="sales" element={<SuperAdminSalesOverview />} />
    <Route path="sales/orders/new" element={<NewOrderSelection />} />
    <Route path="sales/orders/configure" element={<OrderConfiguration />} />
    <Route path="sales/orders/payment" element={<OrderPayment />} />
    <Route path="reports" element={<SuperAdminReports />} />
    <Route path="transactions/:id" element={<TransactionDetail />} />
    <Route path="transactions" element={<Transactions />} />
    <Route path="bulk-import" element={<BulkImport />} />
    <Route path="admin-management" element={<AdminManagement />} />
    <Route path="accounts" element={<AccountsModule />} />
  </Route>
)
