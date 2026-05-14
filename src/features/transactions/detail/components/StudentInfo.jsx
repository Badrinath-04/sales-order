export default function StudentInfo({ student }) {
  const photo = student.photo || ''
  return (
    <section className="rounded-xl border border-surface-variant/20 bg-surface-container-low p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-secondary-container">
          {photo ? (
            <img alt={student.name} className="h-full w-full object-cover" src={photo} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-on-secondary-container">
              {String(student.name ?? '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">{student.name}</h3>
          <p className="text-sm text-on-surface-variant">ID: {student.studentId}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-variant/20 py-2">
          <span className="text-sm text-on-surface-variant">Class</span>
          <span className="text-sm font-bold text-on-surface">{student.classShort}</span>
        </div>
        <div className="flex items-center justify-between border-b border-surface-variant/20 py-2">
          <span className="text-sm text-on-surface-variant">Section</span>
          <span className="text-sm font-bold text-on-surface">{student.section}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-on-surface-variant">Phone</span>
          <span className="text-sm font-bold text-on-surface">{student.phone}</span>
        </div>
      </div>
      <button
        type="button"
        className="mt-6 w-full rounded-lg bg-surface-container-highest/50 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container-highest"
      >
        View Student Profile
      </button>
    </section>
  )
}
