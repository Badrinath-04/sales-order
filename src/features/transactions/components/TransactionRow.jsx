import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import StatusBadge from './StatusBadge'

function formatMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

import { paymentMethodLabel } from '@/constants/paymentMethods'

function paymentLabel(raw) {
  if (!raw || raw === '—') return '—'
  return paymentMethodLabel(raw)
}

export default function TransactionRow({ row, serialNo, listReturnPath }) {
  const navigate = useNavigate()
  const paths = useShellPaths()

  const go = () => {
    navigate(paths.transactionDetail(row.orderPk ?? row.id), {
      state: { ...row, returnTo: listReturnPath, isGroup: row.isGroup },
    })
  }

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-surface-container-low"
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          go()
        }
      }}
      tabIndex={0}
      role="link"
    >
      <td className="px-3 py-5 text-center text-xs font-medium text-on-surface-variant">{serialNo}</td>
      <td className="px-3 py-5 text-sm font-medium text-primary sm:px-4 lg:px-6">{row.orderId}</td>
      <td className="px-3 py-5 font-body text-xs font-medium text-on-surface-variant sm:px-4 lg:px-6">{row.date}</td>
      <td className="transactions-table-student-col px-3 py-5 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.initialsClass}`}
          >
            {row.initials}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-semibold text-on-surface">{row.studentName}</span>
            {row.isGroup && (
              <span className="shrink-0 rounded-full bg-tertiary-fixed/30 px-2 py-0.5 text-[10px] font-bold text-on-tertiary-fixed">
                {row.studentCount} students
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-5 text-sm text-on-surface-variant lg:px-6">{row.classLabel}</td>
      <td className="px-4 py-5 text-sm text-on-surface-variant lg:px-6">{row.branchName ?? '—'}</td>
      <td className="px-3 py-5 sm:px-4 lg:px-6">
        <span className="rounded-full border border-secondary-container/50 bg-secondary-container/30 px-2 py-0.5 text-xs text-on-secondary-container lg:px-3 lg:py-1 lg:text-sm">
          {paymentLabel(row.kitType)}
        </span>
      </td>
      <td className="px-3 py-5 text-sm font-bold text-on-surface sm:px-4 lg:px-6">{formatMoney(row.amount)}</td>
      <td className="px-3 py-5 sm:px-4 lg:px-6">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-5 lg:px-6">
        {row.remarks ? (
          <span
            className="block max-w-[160px] cursor-help truncate text-xs text-on-surface-variant"
            title={row.remarksFull || row.remarks}
          >
            {row.remarks}
          </span>
        ) : (
          <span className="text-xs text-outline-variant">—</span>
        )}
      </td>
      <td className="px-6 py-5 text-right">
        <button
          type="button"
          className="rounded-lg p-2 text-primary transition-all hover:bg-primary/5"
          aria-label="View transaction"
          onClick={(e) => {
            e.stopPropagation()
            go()
          }}
        >
          <span className="material-symbols-outlined text-xl" data-icon="visibility" aria-hidden>
            visibility
          </span>
        </button>
      </td>
    </tr>
  )
}
