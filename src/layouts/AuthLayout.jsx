import { Outlet } from 'react-router-dom'
import './AuthLayout.scss'

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__card">
        <Outlet />
      </div>
    </div>
  )
}
