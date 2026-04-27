import { useCallback, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { publishersApi } from '@/services/api'
import AddPaymentPanel from './AddPaymentPanel'
import AddProcurementPanel from './AddProcurementPanel'

export default function PublisherDetail({ publisherId, onBack, onRefresh }) {
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showAddProcurement, setShowAddProcurement] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetch = useCallback(() => publishersApi.getOne(publisherId), [publisherId, refreshKey])
  const { data, loading } = useApi(fetch, null, [publisherId, refreshKey])
  const p = data?.data ?? data

  function refresh() { setRefreshKey((k) => k + 1); onRefresh?.() }

  if (loading) return <p className="text-sm text-on-surface-variant">Loading publisher…</p>
  if (!p) return null

  const balance = Number(p.pendingBalance ?? 0)

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-base" aria-hidden>arrow_back</span>
          All Publishers
        </button>
        <span className="text-on-surface-variant">/</span>
        <span className="font-bold text-on-surface">{p.name}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Procured</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">₹{Number(p.totalProcured).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Paid</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-emerald-600">₹{Number(p.totalPaid).toLocaleString('en-IN')}</p>
        </div>
        <div className={`rounded-2xl p-6 shadow-sm ring-1 ring-outline-variant/20 ${balance > 0 ? 'bg-amber-50' : 'bg-surface-container-lowest'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Pending Balance</p>
          <p className={`mt-1 font-headline text-2xl font-extrabold ${balance > 0 ? (balance > 10000 ? 'text-error' : 'text-amber-600') : 'text-emerald-600'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowAddProcurement(true)}
          className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-low shadow-sm"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>add_shopping_cart</span>
          Add Procurement
        </button>
        <button
          type="button"
          onClick={() => setShowAddPayment(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>payments</span>
          Add Payment
        </button>
      </div>

      {/* Procurement history */}
      <Section title="Procurement History" icon="receipt_long">
        {!p.procurements?.length ? (
          <p className="text-sm text-on-surface-variant">No procurement records.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 text-left">Date</th>
                <th className="pb-3 text-left">Product</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right">Paid</th>
                <th className="pb-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {p.procurements.map((e) => {
                const bal = Number(e.totalAmount) - Number(e.amountPaid)
                return (
                  <tr key={e.id}>
                    <td className="py-3 text-on-surface-variant">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 font-medium">{e.productLabel}</td>
                    <td className="py-3 text-right">{e.quantity}</td>
                    <td className="py-3 text-right text-on-surface-variant">₹{Number(e.ratePerUnit).toFixed(2)}</td>
                    <td className="py-3 text-right font-medium">₹{Number(e.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right text-emerald-600">₹{Number(e.amountPaid).toLocaleString('en-IN')}</td>
                    <td className={`py-3 text-right font-bold ${bal > 0 ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                      ₹{bal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* Payment history */}
      <Section title="Payment History" icon="payments">
        {!p.payments?.length ? (
          <p className="text-sm text-on-surface-variant">No payment records.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 text-left">Date</th>
                <th className="pb-3 text-left">Method</th>
                <th className="pb-3 text-left">Reference</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {p.payments.map((pay) => (
                <tr key={pay.id}>
                  <td className="py-3 text-on-surface-variant">{new Date(pay.date).toLocaleDateString('en-IN')}</td>
                  <td className="py-3">{pay.paymentMethod.replace(/_/g, ' ')}</td>
                  <td className="py-3 text-on-surface-variant">{pay.referenceId ?? '—'}</td>
                  <td className="py-3 text-right font-bold text-emerald-600">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {showAddPayment && (
        <AddPaymentPanel
          publisherId={publisherId}
          publisherName={p.name}
          onClose={() => setShowAddPayment(false)}
          onSaved={() => { setShowAddPayment(false); refresh() }}
        />
      )}
      {showAddProcurement && (
        <AddProcurementPanel
          publishers={[p]}
          defaultPublisherId={publisherId}
          onClose={() => setShowAddProcurement(false)}
          onSaved={() => { setShowAddProcurement(false); refresh() }}
        />
      )}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary" aria-hidden>{icon}</span>
        <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  )
}
