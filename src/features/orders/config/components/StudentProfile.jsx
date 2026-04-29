export default function StudentProfile({ student, selectedClass, selectedSection, onChangeStudent }) {
  const classLabel = selectedClass?.name ?? selectedClass?.label ?? selectedClass?.id ?? '—'
  const sectionLabel = selectedSection?.name ?? selectedSection?.section ?? selectedSection?.id ?? '—'
  const parentName = student.guardian ?? student.guardianName ?? '—'
  const parentPhone = student.parentPhone ?? '—'

  return (
    <div className="rounded-3xl border border-primary/10 bg-primary/5 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <span className="material-symbols-outlined text-primary" data-icon="person" aria-hidden>
              person
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold">Student Profile</h3>
        </div>
        <button
          type="button"
          onClick={onChangeStudent}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Change Student
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Full Name</p>
          <p className="font-semibold text-on-surface">{student.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Roll Number</p>
          <p className="font-semibold text-on-surface">{student.roll}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Class Name</p>
          <p className="font-semibold text-on-surface">{classLabel}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Section</p>
          <p className="font-semibold text-on-surface">{sectionLabel}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Name</p>
          <p className="font-semibold text-on-surface">{parentName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Phone</p>
          <p className="font-semibold text-on-surface break-all">{parentPhone}</p>
        </div>
      </div>
    </div>
  )
}
