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

  const handleCard = () => {
    if (kitIssued && canOpenPurchase) { onViewPurchase?.(student); return }
    onToggle(student.id)
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        isSelected ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/10 bg-surface-container-lowest'
      }`}
      onClick={handleCard}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); handleCard() } }}
    >
      {/* Radio indicator */}
      <div className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-on-surface">{student.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-outline">{student.roll}</span>
          <BooksBadge value={student.books} />
          {kitIssued
            ? <span className="rounded-full bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold text-on-secondary-container">Issued</span>
            : <PaymentBadge value={student.payment} />}
        </div>
      </div>

      {/* Right side: due or actions */}
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {student.dueAmount > 0 && (
          <button
            type="button"
            onClick={() => onClearDue?.(student)}
            className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-bold text-white hover:opacity-90"
          >
            ₹{student.dueAmount.toFixed(0)} Due
          </button>
        )}
        {canOpenPurchase && !student.dueAmount && (
          <button
            type="button"
            onClick={() => onViewPurchase?.(student)}
            className="rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
          >
            View
          </button>
        )}
      </div>
    </div>
  )
}

export default function StudentTable({
  students,
  selectedStudentIds,
  onToggleStudent,
  totalCount,
  onViewPurchase,
  onClearDue,
}) {
  const footer = (
    <div className="flex items-center justify-between bg-surface-container-lowest px-4 py-2.5">
      <p className="text-xs font-medium text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{students.length}</span>
        {totalCount != null && totalCount !== students.length && (
          <> of <span className="font-bold text-on-surface">{totalCount}</span></>
        )} students
        {selectedStudentIds.length > 0 && (
          <span className="ml-2 font-bold text-primary">· 1 selected</span>
        )}
      </p>
    </div>
  )

  return (
    <>
      {/* Mobile: compact card layout */}
      <div className="mb-24 space-y-2 md:hidden">
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
        <div className="rounded-xl bg-surface-container-lowest">{footer}</div>
      </div>

      {/* Desktop: table layout */}
      <div className="mb-24 hidden overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant">
                <th className="w-8 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" />
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
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-on-surface-variant">
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
