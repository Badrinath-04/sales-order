const avatarToneClass = {
  primary: 'bg-primary-fixed font-bold text-primary',
  secondary: 'bg-secondary-fixed font-bold text-secondary',
  tertiary: 'bg-tertiary-fixed font-bold text-tertiary',
}

function BooksBadge({ value }) {
  if (value === 'Taken') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold text-on-secondary-container">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>check_circle</span>
        Taken
      </span>
    )
  }
  if (value === 'Partial') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold text-on-tertiary-fixed">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>pending</span>
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">
      <span className="material-symbols-outlined text-sm" aria-hidden>cancel</span>
      Not Taken
    </span>
  )
}

function PaymentBadge({ value }) {
  if (value === 'Paid') return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">Paid</span>
  )
  if (value === 'Unpaid') return (
    <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">Unpaid</span>
  )
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">Partial</span>
  )
}

function KitStatusBadge({ value }) {
  if (value === 'FULLY_TAKEN') {
    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">Fully Taken</span>
  }
  if (value === 'PARTIALLY_TAKEN') {
    return <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">Partially Taken</span>
  }
  return <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">Not Taken</span>
}

export default function StudentRow({ student, isSelected, onToggle, onViewPurchase }) {
  const avatarClass = avatarToneClass[student.avatarTone] ?? avatarToneClass.primary
  const kitIssued = student.books === 'Taken' && student.payment === 'Paid'

  const handleRowClick = (e) => {
    if (kitIssued) return
    if (e.target.type === 'checkbox') return
    onToggle(student.id)
  }

  return (
    <tr
      className={`group transition-colors ${
        kitIssued
          ? 'opacity-60 cursor-not-allowed bg-surface-container-low/50'
          : isSelected
          ? 'bg-primary/5 cursor-pointer'
          : 'hover:bg-primary/[0.03] cursor-pointer'
      }`}
      onClick={handleRowClick}
      aria-selected={isSelected}
    >
      <td className="px-6 py-4">
        <input
          className="h-5 w-5 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed"
          type="checkbox"
          checked={isSelected}
          disabled={kitIssued}
          onChange={() => !kitIssued && onToggle(student.id)}
          aria-label={`Select ${student.name}`}
          title={kitIssued ? 'Kit already issued and payment complete' : undefined}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass}`}>
            {student.initials}
          </div>
          <div>
            <p className="font-bold text-on-surface">{student.name}</p>
            <p className="text-xs text-outline">{student.guardian !== 'N/A' ? `Guardian: ${student.guardian}` : ''}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{student.roll}</td>
      <td className="px-6 py-4">
        <div className="inline-flex items-center gap-1">
          <KitStatusBadge value={student.kitStatus} />
          {student.latestOrderNotes ? (
            <span
              className="inline-flex cursor-help text-primary"
              title={student.latestOrderNotes}
              aria-label={`Order note: ${student.latestOrderNotes}`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden>info</span>
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {kitIssued ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold text-on-secondary-container">
              <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>verified</span>
              Kit Issued
            </span>
          ) : (
            <PaymentBadge value={student.payment} />
          )}
          {student.latestOrderId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onViewPurchase?.(student)
              }}
              className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
            >
              View Purchase
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
