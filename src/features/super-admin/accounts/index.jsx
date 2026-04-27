import { useCallback, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { publishersApi } from '@/services/api'
import PublisherDirectory from './components/PublisherDirectory'
import PublisherDetail from './components/PublisherDetail'
import AccountsDashboard from './components/AccountsDashboard'
import AddPublisherPanel from './components/AddPublisherPanel'
import AddProcurementPanel from './components/AddProcurementPanel'

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
  { id: 'publishers', label: 'Publishers', icon: 'store' },
  { id: 'procurements', label: 'Procurement Log', icon: 'receipt_long' },
]

export default function AccountsModule() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPublisherId, setSelectedPublisherId] = useState(null)
  const [showAddPublisher, setShowAddPublisher] = useState(false)
  const [showAddProcurement, setShowAddProcurement] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchPublishers = useCallback(() => publishersApi.list(), [refreshKey])
  const { data: publishersData, loading: pubLoading } = useApi(fetchPublishers, null, [refreshKey])
  const publishers = Array.isArray(publishersData) ? publishersData : (publishersData?.data ?? [])

  const selectedPublisher = publishers.find((p) => p.id === selectedPublisherId) ?? null

  function refresh() { setRefreshKey((k) => k + 1) }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Accounts</h1>
          <p className="text-sm text-on-surface-variant">Publisher directory, procurement records, and payment tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowAddProcurement(true)}
            className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low shadow-sm"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>add_shopping_cart</span>
            Log Procurement
          </button>
          <button
            type="button"
            onClick={() => setShowAddPublisher(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>add</span>
            Add Publisher
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-surface-container-low p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); setSelectedPublisherId(null) }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
            <span className="material-symbols-outlined text-base" aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && <AccountsDashboard onSelectPublisher={(id) => { setSelectedPublisherId(id); setActiveTab('publishers') }} refreshKey={refreshKey} />}
      {activeTab === 'publishers' && !selectedPublisherId && (
        <PublisherDirectory
          publishers={publishers}
          loading={pubLoading}
          onSelect={setSelectedPublisherId}
          onAddPayment={(id) => setSelectedPublisherId(id)}
          onRefresh={refresh}
        />
      )}
      {activeTab === 'publishers' && selectedPublisherId && (
        <PublisherDetail
          publisherId={selectedPublisherId}
          onBack={() => setSelectedPublisherId(null)}
          onRefresh={refresh}
        />
      )}
      {activeTab === 'procurements' && (
        <ProcurementsLog publishers={publishers} refreshKey={refreshKey} />
      )}

      {showAddPublisher && (
        <AddPublisherPanel
          onClose={() => setShowAddPublisher(false)}
          onSaved={() => { setShowAddPublisher(false); refresh() }}
        />
      )}
      {showAddProcurement && (
        <AddProcurementPanel
          publishers={publishers}
          onClose={() => setShowAddProcurement(false)}
          onSaved={() => { setShowAddProcurement(false); refresh() }}
        />
      )}
    </div>
  )
}

function ProcurementsLog({ publishers, refreshKey }) {
  const fetchProc = useCallback(() => publishersApi.listProcurements(), [refreshKey])
  const { data, loading } = useApi(fetchProc, null, [refreshKey])
  const entries = Array.isArray(data) ? data : (data?.data ?? [])

  if (loading) return <p className="text-sm text-on-surface-variant">Loading procurement records…</p>

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="mb-6 font-headline text-lg font-bold text-on-surface">All Procurement Records</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No procurement records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 text-left">Date</th>
                <th className="pb-3 text-left">Publisher</th>
                <th className="pb-3 text-left">Product</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right">Paid</th>
                <th className="pb-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {entries.map((e) => {
                const balance = Number(e.totalAmount) - Number(e.amountPaid)
                return (
                  <tr key={e.id}>
                    <td className="py-3 text-on-surface-variant">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 font-medium">{e.publisher?.name ?? '—'}</td>
                    <td className="py-3 text-on-surface-variant">{e.productLabel}</td>
                    <td className="py-3 text-right">{e.quantity}</td>
                    <td className="py-3 text-right font-medium">₹{Number(e.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-emerald-600">₹{Number(e.amountPaid).toLocaleString('en-IN')}</td>
                    <td className={`py-3 text-right font-bold ${balance > 0 ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                      ₹{balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
