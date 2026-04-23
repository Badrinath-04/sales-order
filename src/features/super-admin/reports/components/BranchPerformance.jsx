const branches = [
  {
    id: 'b1',
    code: 'B1',
    name: 'Central Branch',
    orders: '1,240',
    revenue: '$54,200',
    expenses: '-$12,450',
    profit: '$41,750',
  },
  {
    id: 'b2',
    code: 'B2',
    name: 'Westside Academy',
    orders: '980',
    revenue: '$42,150',
    expenses: '-$15,800',
    profit: '$26,350',
  },
  {
    id: 'b3',
    code: 'B3',
    name: 'East End Hub',
    orders: '750',
    revenue: '$32,100',
    expenses: '-$13,870',
    profit: '$18,230',
  },
]

export default function BranchPerformance() {
  return (
    <section className="mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-headline text-2xl font-bold text-on-surface">Branch Performance</h3>
        <button
          type="button"
          className="flex items-center text-sm font-bold text-primary hover:underline"
        >
          Detailed View{' '}
          <span className="material-symbols-outlined ml-1 text-sm" data-icon="arrow_forward" aria-hidden>
            arrow_forward
          </span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {branches.map((b) => (
          <div
            key={b.id}
            className="rounded-[2.5rem] border border-transparent bg-surface-container-low p-8 transition-colors hover:border-primary/10"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-primary shadow-sm">
                {b.code}
              </div>
              <h4 className="text-lg font-bold">{b.name}</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span className="text-sm text-on-surface-variant">Total Orders</span>
                <span className="font-bold">{b.orders}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span className="text-sm text-on-surface-variant">Revenue</span>
                <span className="font-bold">{b.revenue}</span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span className="text-sm text-on-surface-variant">Expenses</span>
                <span className="font-bold text-error">{b.expenses}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-on-surface">Net Profit</span>
                <span className="text-lg font-extrabold text-green-600">{b.profit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
