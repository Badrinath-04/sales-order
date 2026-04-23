import BranchPerformance from './components/BranchPerformance'
import BranchRevenueComparison from './components/BranchRevenueComparison'
import FinanceSummary from './components/FinanceSummary'
import SalesTrend from './components/SalesTrend'
import TransactionsTable from './components/TransactionsTable'

export default function SuperAdminReports() {
  return (
    <div className="font-body text-on-surface antialiased">
      <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-on-surface-variant">Financial Performance</p>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Financial Overview</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="group flex cursor-pointer items-center rounded-xl bg-surface-container-lowest px-4 py-2.5 shadow-sm transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined mr-2 text-primary" data-icon="calendar_today" aria-hidden>
              calendar_today
            </span>
            <span className="text-sm font-semibold text-on-surface">April 2026</span>
            <span
              className="material-symbols-outlined ml-2 text-on-surface-variant transition-transform group-hover:translate-y-0.5"
              data-icon="expand_more"
              aria-hidden
            >
              expand_more
            </span>
          </button>
          <button
            type="button"
            className="group flex cursor-pointer items-center rounded-xl bg-surface-container-lowest px-4 py-2.5 shadow-sm transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined mr-2 text-primary" data-icon="filter_list" aria-hidden>
              filter_list
            </span>
            <span className="text-sm font-semibold text-on-surface">All Branches</span>
            <span
              className="material-symbols-outlined ml-2 text-on-surface-variant transition-transform group-hover:translate-y-0.5"
              data-icon="expand_more"
              aria-hidden
            >
              expand_more
            </span>
          </button>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-transform active:scale-95"
          >
            Generate Report
          </button>
        </div>
      </section>

      <FinanceSummary />
      <BranchPerformance />

      <section className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SalesTrend />
        <BranchRevenueComparison />
      </section>

      <TransactionsTable />
    </div>
  )
}
