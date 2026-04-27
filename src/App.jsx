import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminSessionProvider from '@/context/AdminSessionProvider'
import { ToastProvider } from '@/context/ToastContext'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/auth'
import { adminShellRouteTree } from '@/routing/AdminRoutes'
import { superAdminShellRouteTree } from '@/routing/SuperAdminRoutes'
import { seniorAdminShellRouteTree } from '@/routing/SeniorAdminRoutes'
import { RootHomeRedirect, NavigateByRole } from '@/routing/NavigateByRole'
import { LegacyTransactionDetailRedirect } from '@/routing/LegacyTransactionRedirect'

export default function App() {
  return (
    <AdminSessionProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootHomeRedirect />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<MainLayout />}>
            {adminShellRouteTree}
            {superAdminShellRouteTree}
            {seniorAdminShellRouteTree}
          </Route>
          <Route path="/dashboard" element={<NavigateByRole adminTo="/admin/dashboard" superTo="/super/dashboard" />} />
          <Route path="/inventory" element={<NavigateByRole adminTo="/admin/inventory" superTo="/super/stock" />} />
          <Route path="/orders" element={<NavigateByRole adminTo="/admin/orders" superTo="/super/sales/orders/new" />} />
          <Route
            path="/orders/new"
            element={<NavigateByRole adminTo="/admin/orders/new" superTo="/super/sales/orders/new" />}
          />
          <Route
            path="/orders/configure"
            element={<NavigateByRole adminTo="/admin/orders/configure" superTo="/super/sales/orders/configure" />}
          />
          <Route
            path="/orders/payment"
            element={<NavigateByRole adminTo="/admin/orders/payment" superTo="/super/sales/orders/payment" />}
          />
          <Route
            path="/transactions"
            element={<NavigateByRole adminTo="/admin/transactions" superTo="/super/transactions" />}
          />
          <Route path="/transactions/:id" element={<LegacyTransactionDetailRedirect />} />
          <Route path="/reports" element={<NavigateByRole adminTo="/admin/reports" superTo="/super/reports" />} />
          <Route path="/sales" element={<NavigateByRole adminTo="/admin/sales" superTo="/super/sales" />} />
          <Route path="/super-admin" element={<RootHomeRedirect />} />
          <Route path="/super-admin/*" element={<RootHomeRedirect />} />
          <Route path="*" element={<RootHomeRedirect />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AdminSessionProvider>
  )
}
