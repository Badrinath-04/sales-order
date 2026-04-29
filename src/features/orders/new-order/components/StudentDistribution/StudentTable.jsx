import { useEffect, useRef } from 'react'
import StudentRow from './StudentRow'

export default function StudentTable({
  students,
  selectedStudentIds,
  onToggleStudent,
  onToggleAll,
  totalCount,
  onViewPurchase,
}) {
  const selectAllRef = useRef(null)
  const eligibleStudents = students.filter((s) => !(s.kitStatus === 'FULLY_TAKEN' && s.payment === 'Paid'))
  const allEligibleSelected =
    eligibleStudents.length > 0 && eligibleStudents.every((s) => selectedStudentIds.includes(s.id))
  const someSelected = eligibleStudents.some((s) => selectedStudentIds.includes(s.id)) && !allEligibleSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected, allEligibleSelected, students.length])

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant">
              <th className="w-12 px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                <input
                  ref={selectAllRef}
                  className="h-5 w-5 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={() => onToggleAll(eligibleStudents.map((s) => s.id))}
                  aria-label="Select all eligible students"
                />
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Kit Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Payment / Kit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                  No students found matching your search or filter.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  isSelected={selectedStudentIds.includes(student.id)}
                  onToggle={onToggleStudent}
                  onViewPurchase={onViewPurchase}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-surface-container-lowest px-6 py-4">
        <p className="text-sm font-medium text-on-surface-variant">
          Showing <span className="text-on-surface font-bold">{students.length}</span>
          {totalCount != null && totalCount !== students.length && (
            <> of <span className="text-on-surface font-bold">{totalCount}</span></>
          )} students
          {selectedStudentIds.length > 0 && (
            <span className="ml-3 font-bold text-primary">· {selectedStudentIds.length} selected</span>
          )}
        </p>
      </div>
    </div>
  )
}
