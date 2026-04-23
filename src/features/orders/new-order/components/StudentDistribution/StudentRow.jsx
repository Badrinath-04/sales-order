const avatarToneClass = {
  primary: 'bg-primary-fixed font-bold text-primary',
  secondary: 'bg-secondary-fixed font-bold text-secondary',
  tertiary: 'bg-tertiary-fixed font-bold text-tertiary',
}

function BooksBadge({ value }) {
  if (value === 'Taken') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold text-on-secondary-container">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>
          check_circle
        </span>
        Taken
      </span>
    )
  }
  if (value === 'Partial') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1 text-[11px] font-bold text-on-tertiary-fixed">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>
          pending
        </span>
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">
      <span className="material-symbols-outlined text-sm" aria-hidden>
        cancel
      </span>
      Not Taken
    </span>
  )
}

function UniformBadge({ value }) {
  if (value === 'Complete') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold text-on-secondary-container">
        <span className="material-symbols-outlined material-symbols-outlined--fill text-sm" aria-hidden>
          check_circle
        </span>
        Complete
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">
      <span className="material-symbols-outlined text-sm" aria-hidden>
        error
      </span>
      Pending
    </span>
  )
}

function PaymentBadge({ value }) {
  if (value === 'Paid') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
        Paid
      </span>
    )
  }
  if (value === 'Unpaid') {
    return (
      <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-on-error-container">
        Unpaid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
      Partial
    </span>
  )
}

export default function StudentRow({ student, isSelected, onToggle }) {
  const avatarClass = avatarToneClass[student.avatarTone] ?? avatarToneClass.primary

  return (
    <tr className="group transition-colors hover:bg-surface-container-low">
      <td className="px-6 py-4">
        <input
          className="rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(student.id)}
          aria-label={`Select ${student.name}`}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass}`}
          >
            {student.initials}
          </div>
          <div>
            <p className="font-bold text-on-surface">{student.name}</p>
            <p className="text-xs text-outline">Guardian: {student.guardian}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{student.roll}</td>
      <td className="px-6 py-4">
        <BooksBadge value={student.books} />
      </td>
      <td className="px-6 py-4">
        <UniformBadge value={student.uniform} />
      </td>
      <td className="px-6 py-4">
        <PaymentBadge value={student.payment} />
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          className="p-2 text-outline transition-colors hover:text-primary"
          aria-label={`Actions for ${student.name}`}
        >
          <span className="material-symbols-outlined" data-icon="more_vert" aria-hidden>
            more_vert
          </span>
        </button>
      </td>
    </tr>
  )
}
