import { Link } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import { transactions as defaultRows } from '../data'

function StatusBadge({ status }) {
  if (status === 'paid' || status === 'PAID') {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-green-700">
        Paid
      </span>
    )
  }
  if (status === 'processing' || status === 'PROCESSING') {
    return (
      <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-on-tertiary-fixed-variant">
        Processing
      </span>
    )
  }
  return (
    <span className="rounded-full bg-error-container px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-on-error-container">
      Pending
    </span>
  )
}

export default function SalesTable({ rows }) {
  const paths = useShellPaths()
  const list = rows === undefined ? defaultRows : rows

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
        <h4 className="font-headline text-lg font-bold text-on-surface">Recent orders</h4>
        <Link to={paths.transactions} className="text-sm font-bold text-primary hover:underline">
          View All Transactions
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <th className="px-6 py-4">Product/Kit Name</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Campus</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {list.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-surface-container-low">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-surface-container-low">
                      {row.imageUrl ? (
                        <img alt="" className="h-full w-full object-cover" src={row.imageUrl} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10">
                          <span className="material-symbols-outlined text-lg text-primary/60" aria-hidden>
                            inventory_2
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold">{row.product}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{row.student}</td>
                <td className="px-6 py-4 text-sm">{row.campus}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{row.date}</td>
                <td className="px-6 py-4 text-sm font-bold">{row.amount}</td>
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
