import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import StatusBadge from './StatusBadge'

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`
}

const METHOD_LABELS = {
  CASH: 'Cash', ONLINE: 'Online / NEFT', CARD: 'Card', CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer', GPAY: 'Google Pay', PHONEPE: 'PhonePe',
  PAYTM: 'Paytm', CREDIT: 'Credit', OTHER: 'Other',
}

function paymentLabel(raw) {
  if (!raw || raw === '—') return '—'
  return METHOD_LABELS[raw.toUpperCase()] ?? raw
}

export default function TransactionRow({ row }) {
  const navigate = useNavigate()
  const paths = useShellPaths()

  const go = () => {
    navigate(paths.transactionDetail(row.id), { state: row })
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
      <td className="px-6 py-5 text-sm font-medium text-primary">{row.orderId}</td>
      <td className="px-6 py-5 font-body text-xs font-medium text-on-surface-variant">{row.date}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${row.initialsClass}`}
          >
            {row.initials}
          </div>
          <span className="text-sm font-semibold text-on-surface">{row.studentName}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-sm text-on-surface-variant">{row.classLabel}</td>
      <td className="px-6 py-5">
        <span className="rounded-full border border-secondary-container/50 bg-secondary-container/30 px-3 py-1 text-sm text-on-secondary-container">
          {paymentLabel(row.kitType)}
        </span>
      </td>
      <td className="px-6 py-5 text-sm font-bold text-on-surface">{formatMoney(row.amount)}</td>
      <td className="px-6 py-5">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-6 py-5">
        {row.remarks ? (
          <span
            className="block max-w-[160px] cursor-help truncate text-xs text-on-surface-variant"
            title={row.remarks}
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
