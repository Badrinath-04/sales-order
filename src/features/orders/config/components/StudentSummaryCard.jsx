export default function StudentSummaryCard({ studentData, onRemove, onEdit }) {
  const { student, selectedClass, selectedSection, totals } = studentData

  return (
    <div className="mb-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
          {student.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-on-surface">{student.name}</p>
          <p className="text-xs text-on-surface-variant">
            {selectedClass?.name ?? selectedClass?.label ?? '—'} ·{' '}
            {selectedSection?.name ?? selectedSection?.section ?? '—'} · ₹
            {Number(totals?.total ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${student.name}`}
          className="shrink-0 rounded-lg p-1.5 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  )
}
