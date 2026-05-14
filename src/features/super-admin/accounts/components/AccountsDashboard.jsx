import { useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { publishersApi } from '@/services/api'

function KpiCard({ label, value, icon, color = 'primary' }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-${color}/10 text-${color}`}>
        <span className="material-symbols-outlined" aria-hidden>{icon}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{value}</p>
    </div>
  )
}

export default function AccountsDashboard({ onSelectPublisher, refreshKey }) {
  const fetch = useCallback(() => publishersApi.dashboard(), [refreshKey])
  const { data, loading } = useApi(fetch, null, [refreshKey])
  const d = data?.data ?? data

  if (loading) return <p className="text-sm text-on-surface-variant">Loading accounts overview…</p>
  if (!d) return null

  const balanceColor = (value) => {
    const amount = Number(value ?? 0)
    if (amount >= 100000) return 'text-error'
    if (amount > 0) return 'text-amber-600'
    return 'text-emerald-600'
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Outstanding Balance" value={`₹${Number(d.totalOutstandingBalance ?? 0).toLocaleString('en-IN')}`} icon="account_balance_wallet" color="error" />
        <KpiCard label="Paid This Month" value={`₹${Number(d.totalPaidThisMonth ?? 0).toLocaleString('en-IN')}`} icon="payments" color="primary" />
        <KpiCard label="Units Procured (Month)" value={Number(d.totalStockProcuredThisMonth ?? 0).toLocaleString('en-IN')} icon="inventory_2" color="secondary" />
        <KpiCard label="Procurement Value (Month)" value={`₹${Number(d.totalAmountThisMonth ?? 0).toLocaleString('en-IN')}`} icon="receipt" color="tertiary" />
      </div>

      {/* Pending balances */}
      <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
        <h3 className="mb-6 font-headline text-lg font-bold text-on-surface">Pending Balances — Publishers</h3>
        {!d.pendingPublishers?.length ? (
          <p className="text-sm text-on-surface-variant">No pending balances. All publishers are settled.</p>
        ) : (
          <div className="space-y-3">
            {d.pendingPublishers.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface-container-low px-5 py-4">
                <div>
                  <p className="font-bold text-on-surface">{p.name}</p>
                  {p.contactPerson && <p className="text-xs text-on-surface-variant">{p.contactPerson} · {p.phone}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${balanceColor(p.pendingBalance)}`}>
                    ₹{Number(p.pendingBalance).toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectPublisher(p.id)}
                    className="rounded-lg border border-outline-variant/30 bg-white px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-low"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
