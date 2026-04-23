import { Link, useNavigate } from 'react-router-dom'

const insightImageUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWTNCqDoS-Q6ZQCz1DAsmdeF4tYjZC6SATRod9sWy8xRf1WsHWS1k4LqntlvU7SHWNALtVB62I_oN4rivco88tKQDOaexLk97rK2Ye38q-Dws3LhnyLM0EjuxN2dtrBGG5FiNfps-VFSo8scTWvlJSn8dTqG8MoYm9kesfOr_p8uxlgXQjYq7bjZNSAywYISHILKmT2i8Rf1qnkxvQj2yuSW0FBBvoWD9vezz9Lyxr7szQdGLnW7yROTJtA1D_WRRZUONJHpuD-0'

const rows = [
  {
    id: '1',
    product: 'Full Premium Kit - Grade 9',
    meta: 'Jordan Smith • 10:42 AM',
    amount: '$145.00',
    status: 'paid',
    icon: 'backpack',
  },
  {
    id: '2',
    product: 'Science Lab Essentials',
    meta: 'Emily Chen • 09:15 AM',
    amount: '$68.50',
    status: 'paid',
    icon: 'science',
  },
  {
    id: '3',
    product: 'Physical Ed Uniform (L)',
    meta: 'Marcus Johnson • 08:30 AM',
    amount: '$42.00',
    status: 'pending',
    icon: 'fitness_center',
  },
]

function StatusBadge({ status }) {
  if (status === 'paid') {
    return (
      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
        Paid
      </span>
    )
  }
  return (
    <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase text-on-tertiary-fixed">
      Pending
    </span>
  )
}

export default function TransactionsList() {
  const navigate = useNavigate()

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
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-5 transition-colors hover:bg-surface-container-low"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
                  <span className="material-symbols-outlined text-outline" data-icon={row.icon} aria-hidden>
                    {row.icon}
                  </span>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-on-surface">{row.product}</h5>
                  <p className="text-xs text-on-surface-variant">{row.meta}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="mb-1 block text-sm font-bold text-on-surface">{row.amount}</span>
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
          <img
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            src={insightImageUrl}
          />
          <div className="relative z-10">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">Quick Insight</span>
            <h4 className="mb-4 text-2xl font-bold leading-tight">
              Stock Alert: Grade 7 Math Kits are running low (5 remaining).
            </h4>
            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              className="rounded-xl bg-white px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-white/90"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
