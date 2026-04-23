import { useState } from 'react'
import AccessoriesView from './components/AccessoriesView'
import BooksView from './components/BooksView'
import KPISection from './components/KPISection'
import Tabs from './components/Tabs'
import UniformsView from './components/UniformsView'
import './styles.scss'

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState('books')

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <header className="tonal-shift sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-stone-50/80 px-8 backdrop-blur-md dark:bg-stone-950/80 bg-stone-100/30 dark:bg-stone-900/30">
        <div className="flex items-center gap-8">
          <h1 className="font-['Manrope'] text-xl font-extrabold text-stone-900 dark:text-stone-50">
            Stock Management
          </h1>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <input
              className="w-64 rounded-full border-none bg-surface-container-highest/50 px-4 py-1.5 text-sm transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search inventory..."
              type="text"
              name="inventory-search"
              autoComplete="off"
            />
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-400">
              search
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-stone-500 transition-colors hover:text-primary"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              type="button"
              className="text-stone-500 transition-colors hover:text-primary"
              aria-label="Help"
            >
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="ml-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-container">
              <img
                alt="User Avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDytIzJoritIhAOaqksA_O2_jOrCuvW5jVCgNuiss3GMqjmbwDCy9C9PGPzlp_MJlaliSXycBWnVj0j3tu1YORP6PseO2-RF2FGlXLZ1wKJZKbdx5Pf8ahyfCk6tagwq-B32ttxQSakmpnargmr5RCpqXLK3NsICj4rQhll-7b-wqwUCjGl3dnYm2BMXnG17ZU2eCuU3yWhRUjq2Y_1JyCRefh_uZ4ECVJP8vBeG5PYJctOxOX8Bsj38QuA60xxFFCW6tY61POrfSE"
              />
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 p-8">
        <KPISection activeTab={activeTab} setActiveTab={setActiveTab} />
        <div key={activeTab} className="inventory-tab-panel">
          {activeTab === 'books' && <BooksView />}
          {activeTab === 'uniforms' && <UniformsView />}
          {activeTab === 'accessories' && <AccessoriesView />}
        </div>
      </div>
    </div>
  )
}
