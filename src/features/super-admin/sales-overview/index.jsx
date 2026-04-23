import { useEffect, useRef, useState } from 'react'
import CampusSalesView from './components/CampusSalesView'
import GlobalSalesView from './components/GlobalSalesView'
import { campusData, campusDropdownOptions } from './data'
import './styles.scss'

export default function SuperAdminSalesOverview() {
  const [selectedCampus, setSelectedCampus] = useState('all')
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

  const selectedLabel = selectedCampus === 'all' ? 'All Campuses' : selectedCampus
  const subtitle =
    selectedCampus === 'all'
      ? 'Monitor sales performance across all campuses'
      : 'Monitoring kit distribution and daily desk performance.'

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Sales Overview</h2>
          <p className="font-medium text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-xl bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-surface-container-low"
              aria-expanded={menuOpen}
              aria-haspopup="listbox"
            >
              <span className="material-symbols-outlined text-lg text-primary" data-icon="domain" aria-hidden>
                domain
              </span>
              {selectedLabel}
              <span className="material-symbols-outlined text-sm text-stone-400" data-icon="keyboard_arrow_down" aria-hidden>
                keyboard_arrow_down
              </span>
            </button>
            <div
              className={`absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-xl ${
                menuOpen ? 'block' : 'hidden'
              }`}
              role="listbox"
            >
              {campusDropdownOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={opt.value === selectedCampus}
                  onClick={() => {
                    setSelectedCampus(opt.value)
                    setMenuOpen(false)
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-fixed ${
                    opt.value === selectedCampus
                      ? 'bg-primary-fixed font-semibold text-primary'
                      : 'text-on-surface'
                  }`}
                >
                  {opt.label}
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
        <div key={selectedCampus} className="sales-overview-view-transition">
          {selectedCampus === 'all' ? (
            <GlobalSalesView />
          ) : (
            <CampusSalesView campus={selectedCampus} data={campusData[selectedCampus]} />
          )}
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-all hover:scale-110 active:scale-95"
        aria-label="Quick add"
      >
        <span className="material-symbols-outlined text-2xl" data-icon="add" aria-hidden>
          add
        </span>
      </button>
    </>
  )
}
