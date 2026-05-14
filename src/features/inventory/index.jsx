import { useEffect, useState } from 'react'
import { ROLES } from '@/config/navigation'
import { useAdminSession } from '@/context/useAdminSession'
import { useSidebar } from '@/context/SidebarContext'
import AccessoriesView from './components/AccessoriesView'
import BooksView from './components/BooksView'
import KPISection from './components/KPISection'
import Tabs from './components/Tabs'
import UniformsView from './components/UniformsView'
import './styles.scss'

export default function InventoryModule() {
  const { role, branchId: sessionBranchId } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const [inventoryBranchId, setInventoryBranchId] = useState(null)
  const { toggle } = useSidebar()

  useEffect(() => {
    if (!isSuperAdmin && sessionBranchId) setInventoryBranchId(sessionBranchId)
  }, [isSuperAdmin, sessionBranchId])

  const [activeTab, setActiveTab] = useState('books')
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-surface font-body text-on-surface">
      {/* Responsive header */}
      <header className="tonal-shift sticky top-0 z-40 w-full min-w-0 bg-stone-50/80 px-4 md:px-5 backdrop-blur-md dark:bg-stone-950/80 bg-stone-100/30 dark:bg-stone-900/30">
        {/* Main header row */}
        <div className="flex h-14 w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-6 min-w-0">
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 rounded-xl p-2 hover:bg-black/5"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-stone-700" aria-hidden>menu</span>
            </button>
            <h1 className="font-['Manrope'] text-base md:text-xl font-extrabold text-stone-900 dark:text-stone-50 truncate">
              Stock Management
            </h1>
            {/* Tabs - hidden on very small, shown from sm */}
            <div className="hidden sm:block">
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Expandable search on mobile */}
            {searchOpen ? (
              <div className="relative flex items-center">
                <input
                  className="w-44 sm:w-64 rounded-full border-none bg-surface-container-highest/50 px-4 py-1.5 text-sm transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Search inventory..."
                  type="text"
                  name="inventory-search"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-1 rounded-full p-1.5 text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden>close</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop search */}
                <div className="relative hidden md:block group">
                  <input
                    className="w-52 lg:w-64 rounded-full border-none bg-surface-container-highest/50 px-4 py-1.5 text-sm transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search inventory..."
                    type="text"
                    name="inventory-search"
                    autoComplete="off"
                  />
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-400">
                    search
                  </span>
                </div>
                {/* Mobile search toggle */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-full p-2 text-stone-500 hover:text-primary md:hidden"
                  aria-label="Search"
                >
                  <span className="material-symbols-outlined">search</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="text-stone-500 transition-colors hover:text-primary"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              type="button"
              className="hidden sm:block text-stone-500 transition-colors hover:text-primary"
              aria-label="Help"
            >
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
        </div>

        {/* Mobile tab row */}
        <div className="sm:hidden pb-2">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </header>

      <div className="flex-1 min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-2 md:px-5 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))]">
        <KPISection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          kpiBranchId={isSuperAdmin ? inventoryBranchId : sessionBranchId}
        />
        <div key={activeTab} className="inventory-tab-panel">
          {activeTab === 'books' && (
            <BooksView
              branchId={isSuperAdmin ? inventoryBranchId : sessionBranchId}
              onBranchIdChange={isSuperAdmin ? setInventoryBranchId : undefined}
            />
          )}
          {activeTab === 'uniforms' && (
            <UniformsView
              branchId={isSuperAdmin ? inventoryBranchId : sessionBranchId}
              onBranchIdChange={isSuperAdmin ? setInventoryBranchId : undefined}
            />
          )}
          {activeTab === 'accessories' && <AccessoriesView />}
        </div>
      </div>
    </div>
  )
}
