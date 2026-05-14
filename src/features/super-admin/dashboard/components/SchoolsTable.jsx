function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function StatusBadge({ status }) {
  if (status === 'Attention') {
    return (
      <span className="inline-flex rounded-full bg-tertiary-container px-3 py-1 font-label text-xs font-bold text-on-tertiary-container">
        {status}
      </span>
    )
  }
  const isActive = status === 'Active'
  return (
    <span
      className={
        isActive
          ? 'inline-flex rounded-full bg-secondary-fixed px-3 py-1 font-label text-xs font-bold text-secondary'
          : 'inline-flex rounded-full bg-surface-container-highest px-3 py-1 font-label text-xs font-bold text-on-surface-variant'
      }
    >
      {status}
    </span>
  )
}

export default function SchoolsTable({ schools }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest">
      <div className="border-b border-outline-variant/10 px-8 py-6">
        <h3 className="font-headline text-xl font-bold text-on-surface">Campus Overview</h3>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Trailing 30-day order counts and collected revenue per campus (from live transactions).
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Campus
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Location
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Total orders
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Revenue
              </th>
              <th className="px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {schools.map((row) => (
              <tr key={row.id} className="bg-surface-container-lowest font-body text-sm">
                <td className="px-6 py-4 font-semibold text-on-surface">{row.name}</td>
                <td className="px-6 py-4 text-on-surface-variant">{row.location}</td>
                <td className="px-6 py-4 text-on-surface">{row.totalOrders30d.toLocaleString('en-US')}</td>
                <td className="px-6 py-4 font-medium text-on-surface">{formatCurrency(row.revenue30d)}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
