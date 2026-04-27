import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { transactionsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import FiltersBar from './components/FiltersBar'
import TransactionsTable from './components/TransactionsTable'
import TrendInsightCard from './components/TrendInsightCard'

function formatCurrency(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const INITIALS_CLASSES = [
  'bg-primary-fixed text-primary',
  'bg-tertiary-fixed text-tertiary',
  'bg-secondary-container text-on-secondary-container',
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-outline-variant text-on-surface',
]

function mapTransactionToRow(tx, idx) {
  const order = tx.order ?? {}
  const student = order.student ?? {}
  return {
    id: tx.id,
    orderId: order.orderId ?? tx.id,
    date: formatDate(tx.paidAt ?? tx.createdAt),
    orderedLine: `Ordered on ${new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    studentName: student.name ?? 'Unknown',
    initials: student.initials ?? '??',
    initialsClass: INITIALS_CLASSES[idx % INITIALS_CLASSES.length],
    classLabel: order.branch?.name ?? '—',
    kitType: tx.paymentMethod ?? '—',
    amount: Number(tx.amount),
    status: tx.status === 'PAID' ? 'Paid' : tx.status === 'PARTIAL' ? 'Partial' : 'Pending',
    remarks: tx.notes ?? '',
  }
}

export default function Transactions() {
  const { branchId } = useAdminSession()

  const fetchKpis = useCallback(
    () => transactionsApi.getKpis({ branchId }),
    [branchId],
  )
  const { data: kpisData, loading: kpisLoading } = useApi(fetchKpis, null, [branchId])

  const fetchTransactions = useCallback(
    () => transactionsApi.list({ branchId, limit: 20 }),
    [branchId],
  )
  const { data: txData, loading: txLoading } = useApi(fetchTransactions, null, [branchId])

  const revenueToday = kpisData?.revenueToday ?? 0
  const ordersToday = kpisData?.ordersToday ?? 0

  const rawRows = Array.isArray(txData) ? txData : (txData?.data ?? [])
  const transactionsRows = rawRows.map((tx, i) => mapTransactionToRow(tx, i))

  return (
    <div className="relative pb-28">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="headline text-4xl font-extrabold tracking-tight text-on-surface">
            Recent Transactions
          </h1>
          <p className="mt-2 font-body font-medium text-on-surface-variant">
            Overview of kits distribution and fee collections.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-4 md:min-w-0">
          <div className="min-w-[200px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Total Revenue Today
            </p>
            <p className="font-headline text-2xl font-bold text-primary">
              {kpisLoading ? '…' : formatCurrency(revenueToday)}
            </p>
          </div>
          <div className="min-w-[200px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Total Orders Today
            </p>
            <p className="font-headline text-2xl font-bold text-tertiary">
              {kpisLoading ? '…' : `${ordersToday} Orders`}
            </p>
          </div>
        </div>
      </div>

      <FiltersBar />
      {txLoading ? (
        <p className="py-8 text-sm text-on-surface-variant">Loading transactions…</p>
      ) : (
        <TransactionsTable rows={transactionsRows} total={rawRows.length} />
      )}
      <TrendInsightCard />
    </div>
  )
}
