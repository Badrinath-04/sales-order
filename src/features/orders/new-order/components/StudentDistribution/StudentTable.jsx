import { useEffect, useRef } from 'react'
import StudentRow from './StudentRow'

export default function StudentTable({
  students,
  selectedStudentIds,
  onToggleStudent,
  onToggleAll,
}) {
  const selectAllRef = useRef(null)
  const allSelected =
    students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id))
  const someSelected = students.some((s) => selectedStudentIds.includes(s.id)) && !allSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected, allSelected, students.length])

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant">
              <th className="w-12 px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                <input
                  ref={selectAllRef}
                  className="rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll(students.map((s) => s.id))}
                  aria-label="Select all students on page"
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Books Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Uniform Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                isSelected={selectedStudentIds.includes(student.id)}
                onToggle={onToggleStudent}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-surface-container-lowest p-6">
        <p className="text-sm font-medium text-on-surface-variant">
          {students.length === 0 ? (
            <>
              Showing <span className="text-on-surface">0</span> of{' '}
              <span className="text-on-surface">42</span> students
            </>
          ) : (
            <>
              Showing <span className="text-on-surface">1-{students.length}</span> of{' '}
              <span className="text-on-surface">42</span> students
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-outline-variant p-2 text-outline transition-colors hover:bg-surface-container-low disabled:opacity-50"
            disabled
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined" data-icon="chevron_left" aria-hidden>
              chevron_left
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-on-primary shadow-sm"
          >
            1
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            2
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            3
          </button>
          <button
            type="button"
            className="rounded-lg border border-outline-variant p-2 text-outline transition-colors hover:bg-surface-container-low"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined" data-icon="chevron_right" aria-hidden>
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
