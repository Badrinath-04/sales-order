import { Navigate, Route } from 'react-router-dom'
import AdminDashboard from '@/features/admin/dashboard'
import Settings from '@/features/admin/settings'
import Inventory from '@/features/inventory'
import NewOrderSelection from '@/features/orders/new-order'
import OrderConfiguration from '@/features/orders/config'
import OrderPayment from '@/features/orders/payment'
import Transactions from '@/features/transactions'
import TransactionDetail from '@/features/transactions/detail'
import AccountsModule from '@/features/super-admin/accounts'
import SalesOverview from '@/features/sales/dashboard/SalesOverview'
import { usePermission } from '@/hooks/usePermission'
import { AdminShellGuard } from '@/routing/ShellGuards'
import BranchShellSmartRedirect from '@/routing/BranchShellSmartRedirect'

function GuardedModule({ flag, children }) {
  const allowed = usePermission(flag)
  if (!allowed) return <BranchShellSmartRedirect segment="admin" />
  return children
}

function GuardedAccounts({ children }) {
  const canManageAccounts = usePermission('canManageAccounts')
  const canManagePublishers = usePermission('canManagePublishers')
  const canViewPublisherFinancials = usePermission('canViewPublisherFinancials')
  if (!(canManageAccounts || canManagePublishers || canViewPublisherFinancials)) {
    return <BranchShellSmartRedirect segment="admin" />
  }
  return children
}

/** Route element tree (not a component) so parent `<Routes>` registers nested routes. */
export const adminShellRouteTree = (
  <Route path="admin" element={<AdminShellGuard />}>
    <Route index element={<BranchShellSmartRedirect segment="admin" />} />
    <Route path="dashboard" element={<GuardedModule flag="canViewDashboard"><AdminDashboard /></GuardedModule>} />
    <Route path="inventory" element={<GuardedModule flag="canUpdateStock"><Inventory /></GuardedModule>} />
    <Route path="orders" element={<GuardedModule flag="canPlaceOrders"><NewOrderSelection /></GuardedModule>} />
    <Route path="orders/new" element={<GuardedModule flag="canPlaceOrders"><NewOrderSelection /></GuardedModule>} />
    <Route path="orders/configure" element={<GuardedModule flag="canPlaceOrders"><OrderConfiguration /></GuardedModule>} />
    <Route path="orders/payment" element={<GuardedModule flag="canPlaceOrders"><OrderPayment /></GuardedModule>} />
    <Route path="settings" element={<GuardedModule flag="canViewSettings"><Settings /></GuardedModule>} />
    <Route path="reports" element={<GuardedModule flag="canViewReports"><SalesOverview /></GuardedModule>} />
    <Route path="sales" element={<Navigate to="/admin/reports" replace />} />
    <Route path="accounts" element={<GuardedAccounts><AccountsModule /></GuardedAccounts>} />
    <Route path="transactions/:id" element={<GuardedModule flag="canViewTransactions"><TransactionDetail /></GuardedModule>} />
    <Route path="transactions" element={<GuardedModule flag="canViewTransactions"><Transactions /></GuardedModule>} />
    <Route path="*" element={<BranchShellSmartRedirect segment="admin" />} />
  </Route>
)
