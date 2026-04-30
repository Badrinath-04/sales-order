const VARIANTS = {
  Paid: {
    wrap: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  Pending: {
    wrap: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  Partial: {
    wrap: 'bg-secondary-container/40 text-on-secondary-container',
    dot: 'bg-secondary',
  },
  Credit: {
    wrap: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
}

export default function StatusBadge({ status }) {
  const v = VARIANTS[status] ?? VARIANTS.Pending

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${v.wrap}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${v.dot}`} aria-hidden />
      {status}
    </span>
  )
}
