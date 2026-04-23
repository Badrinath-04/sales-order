export default function SelectedStudentsBar({ selectedStudents }) {
  const preview = selectedStudents.slice(0, 3)

  return (
    <div className="new-order-float-reveal flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-bright px-6 py-3 shadow-2xl">
      <div className="flex -space-x-2">
        {preview.map((s) => (
          <div
            key={s.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold ${
              s.avatarTone === 'secondary'
                ? 'bg-secondary-fixed text-secondary'
                : s.avatarTone === 'tertiary'
                  ? 'bg-tertiary-fixed text-tertiary'
                  : 'bg-primary-fixed text-primary'
            }`}
          >
            {s.initials}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-on-surface">
        {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} selected for order
      </p>
    </div>
  )
}
