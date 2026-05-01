const avatarToneClass = {
  primary: 'bg-primary-fixed font-bold text-primary',
  secondary: 'bg-secondary-fixed font-bold text-secondary',
  tertiary: 'bg-tertiary-fixed font-bold text-tertiary',
}

function BooksBadge({ value }) {
  if (value === 'Taken') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-xs" aria-hidden>check_circle</span>
        Taken
      </span>
    )
  }
  if (value === 'Partial') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-[10px] font-bold text-on-tertiary-fixed">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-xs" aria-hidden>pending</span>
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 text-[10px] font-bold text-on-error-container">
      <span className="material-symbols-outlined text-xs" aria-hidden>cancel</span>
      Not Taken
    </span>
  )
}

function PaymentBadge({ value }) {
  if (value === 'Paid') return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">Paid</span>
  )
  if (value === 'Unpaid') return (
    <span className="inline-flex items-center rounded-full bg-error-container px-2.5 py-0.5 text-[10px] font-bold text-on-error-container">Unpaid</span>
  )
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">Partial</span>
  )
}

export default function StudentRow({ student, isSelected, onToggle, onViewPurchase, onClearDue }) {
  const avatarClass = avatarToneClass[student.avatarTone] ?? avatarToneClass.primary
  const kitIssued = student.books === 'Taken' && student.payment === 'Paid'
  const canOpenPurchase = Boolean(onViewPurchase && student.latestOrderId)

  const handleRowClick = (e) => {
    if (e.target.type === 'checkbox') return
    if (kitIssued) {
      if (canOpenPurchase) {
        onViewPurchase?.(student)
        return
      }
      onToggle(student.id)
      return
    }
    onToggle(student.id)
  }

  return (
    <tr
      className={`group transition-colors ${
        isSelected
          ? 'bg-primary/5 cursor-pointer'
          : 'hover:bg-primary/[0.03] cursor-pointer'
      }`}
      onClick={handleRowClick}
      aria-selected={isSelected}
    >
      <td className="px-4 py-3">
        <input
          className="h-4 w-4 cursor-pointer rounded border-2 border-outline-variant text-primary focus:ring-2 focus:ring-primary/30"
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
          aria-label={`Select ${student.name}`}
          title={kitIssued && canOpenPurchase ? 'Kit already issued. Opening purchase history.' : undefined}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${avatarClass}`}>
            {student.initials}
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight text-on-surface">{student.name}</p>
            <p className="text-xs text-outline">{student.guardian !== 'N/A' ? `Guardian: ${student.guardian}` : ''}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[15px] font-medium text-on-surface-variant">{student.roll}</td>
      <td className="px-4 py-3">
        <BooksBadge value={student.books} />
      </td>
      <td className="px-4 py-3">
        {kitIssued ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
            <span className="material-symbols-outlined material-symbols-outlined--fill text-xs" aria-hidden>verified</span>
            Paid / Issued
          </span>
        ) : (
          <PaymentBadge value={student.payment} />
        )}
      </td>
      <td className="px-4 py-3">
        {student.dueAmount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
            ₹{student.dueAmount.toFixed(2)}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-outline">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {canOpenPurchase ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onViewPurchase?.(student)
              }}
              className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/10"
            >
              View Purchase
            </button>
          ) : (
            <span className="text-xs font-medium text-outline">—</span>
          )}
          {student.dueAmount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClearDue?.(student)
              }}
              className="rounded-lg bg-primary px-2.5 py-0.5 text-[11px] font-bold text-on-primary hover:opacity-90"
            >
              Clear Due
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
