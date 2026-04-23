export default function StudentProfile({ student, sectionId, onChangeStudent }) {
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
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Full Name</p>
          <p className="font-semibold text-on-surface">{student.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Roll Number</p>
          <p className="font-semibold text-on-surface">{student.roll}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Section</p>
          <p className="font-semibold text-on-surface">{sectionId}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Phone</p>
          <p className="font-semibold text-on-surface">{student.parentPhone ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
