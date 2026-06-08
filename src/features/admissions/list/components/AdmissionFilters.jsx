import { SCHOOL_CLASSES } from '@/utils/classes'

const fieldClass =
  'rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
]

export default function AdmissionFilters({ filters, sectionsByGrade, onChange }) {
  const sections = filters.grade !== '' ? sectionsByGrade?.[Number(filters.grade)] ?? [] : []

  function update(patch) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
          search
        </span>
        <input
          className={`${fieldClass} w-full pl-9`}
          placeholder="Search by name or phone…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>
      <select
        className={fieldClass}
        value={filters.grade}
        onChange={(e) => update({ grade: e.target.value, section: '' })}
      >
        <option value="">All classes</option>
        {SCHOOL_CLASSES.map((c) => (
          <option key={c.grade} value={c.grade}>{c.label}</option>
        ))}
      </select>
      <select
        className={fieldClass}
        value={filters.section}
        onChange={(e) => update({ section: e.target.value })}
        disabled={filters.grade === ''}
      >
        <option value="">All sections</option>
        {sections.map((s) => (
          <option key={s} value={s}>Section {s}</option>
        ))}
      </select>
      <select className={fieldClass} value={filters.status} onChange={(e) => update({ status: e.target.value })}>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
