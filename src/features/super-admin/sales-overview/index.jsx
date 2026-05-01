import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { useShellPaths } from '@/hooks/useShellPaths'
import SalesOverview from '@/features/sales/dashboard/SalesOverview'
import GlobalSalesView from './components/GlobalSalesView'
import './styles.scss'

export default function SuperAdminSalesOverview() {
  const navigate = useNavigate()
  const paths = useShellPaths()

  const fetchBranches = useCallback(() => branchesApi.list(), [])
  const { data: branchesPayload } = useApi(fetchBranches, null, [])
  const branches = Array.isArray(branchesPayload) ? branchesPayload : branchesPayload?.data ?? []

  const [selectedBranchId, setSelectedBranchId] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const selectedLabel =
    selectedBranchId === 'all'
      ? 'All Campuses'
      : branches.find((b) => b.id === selectedBranchId)?.name ?? 'Campus'

  const subtitle =
    selectedBranchId === 'all'
      ? 'Monitor performance and collections across all campuses'
      : `Reports and collections for ${selectedLabel}.`

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Reports</h2>
          <p className="font-medium text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex max-w-[min(100vw-2rem,280px)] items-center gap-3 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-surface-container-low"
              aria-expanded={menuOpen}
              aria-haspopup="listbox"
            >
              <span className="material-symbols-outlined shrink-0 text-lg text-primary" data-icon="domain" aria-hidden>
                domain
              </span>
              <span className="truncate">{selectedLabel}</span>
              <span className="material-symbols-outlined shrink-0 text-sm text-stone-400" data-icon="keyboard_arrow_down" aria-hidden>
                keyboard_arrow_down
              </span>
            </button>
            <div
              className={`absolute right-0 top-full z-50 mt-2 max-h-[min(60vh,320px)] w-56 overflow-y-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-xl ${
                menuOpen ? 'block' : 'hidden'
              }`}
              role="listbox"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedBranchId === 'all'}
                onClick={() => {
                  setSelectedBranchId('all')
                  setMenuOpen(false)
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-fixed ${
                  selectedBranchId === 'all' ? 'bg-primary-fixed font-semibold text-primary' : 'text-on-surface'
                }`}
              >
                All Campuses
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  aria-selected={selectedBranchId === b.id}
                  onClick={() => {
                    setSelectedBranchId(b.id)
                    setMenuOpen(false)
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-fixed ${
                    selectedBranchId === b.id ? 'bg-primary-fixed font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-bold text-on-primary-container shadow-sm transition-all hover:opacity-90"
          >
            <span className="material-symbols-outlined text-lg" data-icon="download" aria-hidden>
              download
            </span>
            Export Report
          </button>
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        <div key={selectedBranchId} className="sales-overview-view-transition">
          {selectedBranchId === 'all' ? (
            <GlobalSalesView />
          ) : (
            <SalesOverview branchIdOverride={selectedBranchId} embedded />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(paths.ordersNew)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-all hover:scale-110 active:scale-95"
        aria-label="New order"
      >
        <span className="material-symbols-outlined text-2xl" data-icon="add" aria-hidden>
          add
        </span>
      </button>
    </>
  )
}
