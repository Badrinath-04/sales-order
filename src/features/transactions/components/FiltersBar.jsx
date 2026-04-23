import { useState } from 'react'
import MultiSelectDropdown from './MultiSelectDropdown'
import SelectDropdown from './SelectDropdown'

const DATE_OPTIONS = [
  { value: 'Last 7 Days', label: 'Last 7 Days' },
  { value: 'Last 30 Days', label: 'Last 30 Days' },
  { value: 'Current Term', label: 'Current Term' },
]

const CLASS_OPTIONS = [
  { value: 'All Classes', label: 'All Classes' },
  { value: 'Class 1-5', label: 'Class 1-5' },
  { value: 'Class 6-10', label: 'Class 6-10' },
  { value: 'Class 11-12', label: 'Class 11-12' },
]

const STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid', count: 124 },
  { value: 'Pending', label: 'Pending', count: 42 },
  { value: 'Partial', label: 'Partial', count: 18 },
]

export default function FiltersBar() {
  const [openMenu, setOpenMenu] = useState(null)
  const [filters, setFilters] = useState({
    date: 'Last 7 Days',
    class: 'All Classes',
    status: [],
  })

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl bg-surface-container-low p-4">
      <SelectDropdown
        label=""
        icon="calendar_today"
        options={DATE_OPTIONS}
        value={filters.date}
        onChange={(date) => setFilters((f) => ({ ...f, date }))}
        menuKey="date"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        sectionLabel="Recent"
        showSection
        compact
      />
      <SelectDropdown
        label=""
        icon="school"
        options={CLASS_OPTIONS}
        value={filters.class}
        onChange={(klass) => setFilters((f) => ({ ...f, class: klass }))}
        menuKey="class"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        showSection={false}
        compact
      />
      <MultiSelectDropdown
        label=""
        icon="payments"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(status) => setFilters((f) => ({ ...f, status }))}
        menuKey="status"
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        placeholderSummary="Payment Status"
        compact
      />
      <button
        type="button"
        className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary-container"
      >
        <span className="material-symbols-outlined text-sm" data-icon="filter_list" aria-hidden>
          filter_list
        </span>
        Apply Filters
      </button>
    </div>
  )
}
