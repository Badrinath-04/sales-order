import { useCallback } from 'react'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import BranchPerformance from './components/BranchPerformance'
import BranchRevenueComparison from './components/BranchRevenueComparison'
import FinanceSummary from './components/FinanceSummary'
import SalesTrend from './components/SalesTrend'
import TransactionsTable from './components/TransactionsTable'

export default function SuperAdminReports() {
  const fetchFinance = useCallback(() => reportsApi.financeSummary({ days: 30 }), [])
  const { data: financeData, loading: financeLoading } = useApi(fetchFinance, null, [])

  const fetchBranchPerf = useCallback(() => reportsApi.branchPerformance({ days: 30 }), [])
  const { data: branchData, loading: branchLoading } = useApi(fetchBranchPerf, null, [])

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
            <span className="material-symbols-outlined mr-2 text-primary" aria-hidden>calendar_today</span>
            <span className="text-sm font-semibold text-on-surface">Last 30 Days</span>
          </button>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-transform active:scale-95"
          >
            Generate Report
          </button>
        </div>
      </section>

      <FinanceSummary data={financeData} loading={financeLoading} />
      <BranchPerformance data={branchData} loading={branchLoading} />

      <section className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SalesTrend />
        <BranchRevenueComparison />
      </section>

      <TransactionsTable />
    </div>
  )
}
