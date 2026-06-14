export default function CombinedTotalBar({ completedStudents, currentTotal, onAddStudent, onConfirmAndPay, isDesktopCollapsed }) {
  const completedTotal = completedStudents.reduce((sum, s) => sum + Number(s.totals?.total ?? 0), 0)
  const grandTotal = completedTotal + Number(currentTotal ?? 0)

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant/20 bg-surface/95 px-4 py-3 backdrop-blur-sm ${
        isDesktopCollapsed ? '' : 'lg:left-64'
      }`}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {completedStudents.map((s, i) => (
            <span key={i} className="text-xs text-on-surface-variant">
              {s.student.name.split(' ')[0]}{' '}
              <span className="font-medium text-on-surface">
                ₹{Number(s.totals?.total ?? 0).toLocaleString('en-IN')}
              </span>
            </span>
          ))}
          {Number(currentTotal ?? 0) > 0 && (
            <span className="text-xs text-on-surface-variant">
              Current{' '}
              <span className="font-medium text-on-surface">
                ₹{Number(currentTotal).toLocaleString('en-IN')}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Grand Total ({completedStudents.length + 1} students)
            </p>
            <p className="text-xl font-extrabold text-on-surface">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAddStudent}
              className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              + Add Student
            </button>
            <button
              type="button"
              onClick={onConfirmAndPay}
              disabled={Number(currentTotal ?? 0) <= 0}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm disabled:opacity-50"
            >
              Confirm &amp; Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
