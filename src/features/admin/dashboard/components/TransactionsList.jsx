import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { transactionsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

function StatusBadge({ status }) {
  if (status === 'PAID') {
    return (
      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
        Paid
      </span>
    )
  }
  if (status === 'PARTIAL') {
    return (
      <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase text-on-tertiary-fixed">
        Partial
      </span>
    )
  }
  return (
    <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-error-container">
      Unpaid
    </span>
  )
}

function formatCurrency(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function TransactionsList() {
  const navigate = useNavigate()
  const { branchId } = useAdminSession()

  const fetchTransactions = useCallback(
    () => transactionsApi.list({ branchId, limit: 5 }),
    [branchId],
  )
  const { data, loading } = useApi(fetchTransactions, null, [branchId])

  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-on-surface">Recent Transactions</h3>
          <Link to="/admin/transactions" className="text-sm font-bold text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {loading && (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          )}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-on-surface-variant">No transactions today.</p>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-5 transition-colors hover:bg-surface-container-low"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
                  <span className="material-symbols-outlined text-outline" aria-hidden>
                    receipt_long
                  </span>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-on-surface">
                    {row.order?.student?.name ?? 'Unknown Student'}
                  </h5>
                  <p className="text-xs text-on-surface-variant">
                    {row.order?.branch?.name} • {formatTime(row.paidAt ?? row.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-1 block text-sm font-bold text-on-surface">{formatCurrency(row.amount)}</span>
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="relative flex min-h-[300px] h-full flex-col justify-end overflow-hidden rounded-[2rem] bg-primary p-8 text-on-primary">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-20 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">Quick Action</span>
            <h4 className="mb-4 text-2xl font-bold leading-tight">
              Process a new order for a student
            </h4>
            <button
              type="button"
              onClick={() => navigate('/admin/orders/new')}
              className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-white/90"
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
