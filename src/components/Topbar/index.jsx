import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'

export default function Topbar() {
  const { user, logout } = useAdminSession()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between bg-[#fbf9f8]/80 px-8 backdrop-blur-md dark:bg-slate-950/80">
      <div className="max-w-md flex-grow">
        <div className="group relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline"
            data-icon="search"
            aria-hidden
          >
            search
          </span>
          <input
            className="w-full rounded-xl border-none bg-surface-container-highest py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary"
            placeholder="Search orders or students..."
            type="search"
            name="admin-search"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 text-primary dark:text-primary-container">
        <button
          type="button"
          className="relative rounded-full p-2 transition-colors hover:bg-surface-container-low"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-1.5 transition-colors hover:bg-surface-container-low"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
          >
            <span className="material-symbols-outlined" data-icon="account_circle" aria-hidden>
              account_circle
            </span>
            {user?.displayName && (
              <span className="hidden text-sm font-medium text-on-surface sm:block">
                {user.displayName}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface shadow-lg">
              {user && (
                <div className="border-b border-outline-variant/10 px-4 py-3">
                  <p className="text-sm font-bold text-on-surface">{user.displayName}</p>
                  <p className="text-xs text-on-surface-variant">{user.role}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-error transition-colors hover:bg-error/5"
              >
                <span className="material-symbols-outlined text-base" aria-hidden>
                  logout
                </span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
