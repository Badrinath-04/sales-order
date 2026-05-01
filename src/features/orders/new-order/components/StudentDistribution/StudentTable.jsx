import { useEffect, useRef } from 'react'
import StudentRow from './StudentRow'

function StudentCard({ student, isSelected, onToggle, onViewPurchase, onClearDue }) {
  const kitIssued = student.books === 'Taken' && student.payment === 'Paid'
  const canOpenPurchase = Boolean(onViewPurchase && student.latestOrderId)

  function BooksBadge({ value }) {
    if (value === 'Taken') return <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">Taken</span>
    if (value === 'Partial') return <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold text-on-tertiary-fixed">Partial</span>
    return <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container">Not Taken</span>
  }

  function PaymentBadge({ value }) {
    if (value === 'Paid') return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Paid</span>
    if (value === 'Unpaid') return <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container">Unpaid</span>
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Partial</span>
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isSelected
          ? 'border-primary/30 bg-primary/5'
          : 'border-outline-variant/10 bg-surface-container-lowest'
      }`}
      onClick={() => {
        if (kitIssued) {
          if (canOpenPurchase) {
            onViewPurchase?.(student)
            return
          }
          onToggle(student.id)
          return
        }
        onToggle(student.id)
      }}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== ' ') return
        e.preventDefault()
        if (kitIssued) {
          if (canOpenPurchase) {
            onViewPurchase?.(student)
            return
          }
          onToggle(student.id)
          return
        }
        onToggle(student.id)
      }}
    >
      <div className="mb-3 flex items-start gap-3">
        <input
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
          type="checkbox"
          checked={isSelected}
          onChange={() => {
            if (kitIssued) {
              if (canOpenPurchase) {
                onViewPurchase?.(student)
                return
              }
              onToggle(student.id)
              return
            }
            onToggle(student.id)
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${student.name}`}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface truncate">{student.name}</p>
          <p className="text-xs text-outline">Roll: {student.roll}</p>
          {student.guardian !== 'N/A' && (
            <p className="text-xs text-outline truncate">Guardian: {student.guardian}</p>
          )}
        </div>
        {student.dueAmount > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            ₹{student.dueAmount.toFixed(2)}
          </span>
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <BooksBadge value={student.books} />
        {kitIssued ? (
          <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">Paid / Issued</span>
        ) : (
          <PaymentBadge value={student.payment} />
        )}
      </div>
      {(student.latestOrderId || student.dueAmount > 0) && (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canOpenPurchase && (
            <button
              type="button"
              onClick={() => onViewPurchase?.(student)}
              className="flex-1 rounded-xl border border-primary/20 bg-primary/5 py-2 text-[11px] font-bold text-primary hover:bg-primary/10"
            >
              View Purchase
            </button>
          )}
          {student.dueAmount > 0 && (
            <button
              type="button"
              onClick={() => onClearDue?.(student)}
              className="flex-1 rounded-xl bg-primary py-2 text-[11px] font-bold text-on-primary hover:opacity-90"
            >
              Clear Due
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentTable({
  students,
  selectedStudentIds,
  onToggleStudent,
  onToggleAll,
  totalCount,
  onViewPurchase,
  onClearDue,
}) {
  const selectAllRef = useRef(null)
  const eligibleStudents = students.filter((s) => !(s.books === 'Taken' && s.payment === 'Paid'))
  const allEligibleSelected =
    eligibleStudents.length > 0 && eligibleStudents.every((s) => selectedStudentIds.includes(s.id))
  const someSelected = eligibleStudents.some((s) => selectedStudentIds.includes(s.id)) && !allEligibleSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected, allEligibleSelected, students.length])

  const footer = (
    <div className="flex items-center justify-between bg-surface-container-lowest px-4 py-3">
      <p className="text-xs font-medium text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{students.length}</span>
        {totalCount != null && totalCount !== students.length && (
          <> of <span className="font-bold text-on-surface">{totalCount}</span></>
        )} students
        {selectedStudentIds.length > 0 && (
          <span className="ml-3 font-bold text-primary">· {selectedStudentIds.length} selected</span>
        )}
      </p>
    </div>
  )

  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {eligibleStudents.length > 0 && (
          <div className="flex items-center gap-3 px-1 py-2">
            <input
              ref={selectAllRef}
              className="h-4 w-4 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
              type="checkbox"
              checked={allEligibleSelected}
              onChange={() => onToggleAll(eligibleStudents.map((s) => s.id))}
              aria-label="Select all eligible students"
            />
            <span className="text-xs font-semibold text-on-surface-variant">Select all eligible</span>
          </div>
        )}
        {students.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            No students found matching your search or filter.
          </p>
        ) : (
          students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={selectedStudentIds.includes(student.id)}
              onToggle={onToggleStudent}
              onViewPurchase={onViewPurchase}
              onClearDue={onClearDue}
            />
          ))
        )}
        <div className="rounded-xl bg-surface-container-lowest">
          {footer}
        </div>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant">
                <th className="w-10 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
                  <input
                    ref={selectAllRef}
                    className="h-4 w-4 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={() => onToggleAll(eligibleStudents.map((s) => s.id))}
                    aria-label="Select all eligible students"
                  />
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Student Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Roll No</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Books Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Payment Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Due Amount</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-on-surface-variant">
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
                    onClearDue={onClearDue}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    </>
  )
}
