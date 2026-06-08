function formatCurrency(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function SummaryBar({ totalStudents = 0, totalCollected = 0, pendingCount = 0 }) {
  const stats = [
    { label: 'Students', value: totalStudents.toLocaleString('en-IN'), icon: 'groups' },
    { label: 'Collected', value: formatCurrency(totalCollected), icon: 'payments' },
    { label: 'Pending', value: pendingCount.toLocaleString('en-IN'), icon: 'hourglass_empty' },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3"
        >
          <span className="material-symbols-outlined text-2xl text-primary">{s.icon}</span>
          <div>
            <p className="text-lg font-bold text-on-surface leading-tight">{s.value}</p>
            <p className="text-xs text-on-surface-variant">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
