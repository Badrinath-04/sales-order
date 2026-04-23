import KPICard from '@/components/ui/KPICard'
import CampusBreakdown from './CampusBreakdown'
import InsightsCard from './InsightsCard'
import SalesChart from './SalesChart'
import SalesTable from './SalesTable'
import { metrics } from '../data'

export default function GlobalSalesView() {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <KPICard key={m.id} metric={m} />
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <SalesChart />
        <div className="space-y-6">
          <InsightsCard />
          <CampusBreakdown />
        </div>
      </div>

      <SalesTable />
    </>
  )
}
