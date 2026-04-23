import FiltersBar from './components/FiltersBar'
import TransactionsTable from './components/TransactionsTable'
import TrendInsightCard from './components/TrendInsightCard'
import { transactionsKpis, transactionsRows } from './data'

function formatCurrency(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Transactions() {
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
              {formatCurrency(transactionsKpis.revenueToday)}
            </p>
          </div>
          <div className="min-w-[200px] rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
            <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Total Orders Today
            </p>
            <p className="font-headline text-2xl font-bold text-tertiary">
              {transactionsKpis.ordersToday} Orders
            </p>
          </div>
        </div>
      </div>

      <FiltersBar />
      <TransactionsTable rows={transactionsRows} />
      <TrendInsightCard />
    </div>
  )
}
