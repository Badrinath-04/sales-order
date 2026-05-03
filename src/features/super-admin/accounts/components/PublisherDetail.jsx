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
  const balanceColorClass = balance > 0
    ? (balance >= 100000 ? 'text-error' : 'text-amber-600')
    : 'text-emerald-600'

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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Procured</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">₹{Number(p.totalProcured).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Paid</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-emerald-600">₹{Number(p.totalPaid).toLocaleString('en-IN')}</p>
        </div>
        <div className={`rounded-2xl p-6 shadow-sm ring-1 ring-outline-variant/20 ${balance > 0 ? 'bg-amber-50' : 'bg-surface-container-lowest'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Outstanding</p>
          <p className={`mt-1 font-headline text-2xl font-extrabold ${balanceColorClass}`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/20">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Last Payment</p>
          <p className="mt-1 font-headline text-xl font-extrabold text-on-surface">
            {p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString('en-IN') : '—'}
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
          <>
            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {p.procurements.map((e) => {
                const bal = Number(e.totalAmount) - Number(e.amountPaid)
                return (
                  <div key={e.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="font-semibold text-on-surface">{e.productLabel}</p>
                      <span className="flex-shrink-0 text-xs text-on-surface-variant">{new Date(e.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="mb-2 text-xs text-on-surface-variant">
                      Qty: {e.quantity} &nbsp;·&nbsp; D:{Number(e.qtyDarga ?? 0)} / N:{Number(e.qtyNarsingi ?? 0)} / S:{Number(e.qtySheikpet ?? 0)}
                    </p>
                    <div className="flex items-center justify-between border-t border-outline-variant/10 pt-2">
                      <div>
                        <p className="text-xs text-on-surface-variant">Paid</p>
                        <p className="text-sm font-semibold text-emerald-600">₹{Number(e.amountPaid).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant">Balance</p>
                        <p className={`text-sm font-bold ${bal > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {bal > 0 ? `₹${bal.toLocaleString('en-IN')}` : 'Settled ✓'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <th className="pb-3 text-left">Date</th>
                  <th className="pb-3 text-left">Product</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-left">Distribution</th>
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
                      <td className="py-3 text-xs text-on-surface-variant">
                        D:{Number(e.qtyDarga ?? 0)} / N:{Number(e.qtyNarsingi ?? 0)} / S:{Number(e.qtySheikpet ?? 0)}
                      </td>
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
          </>
        )}
      </Section>

      {/* Payment history */}
      <Section title="Payment History" icon="payments">
        {!p.payments?.length ? (
          <p className="text-sm text-on-surface-variant">No payment records.</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {(p.paymentLedger ?? p.payments ?? []).map((pay) => (
                <div key={pay.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold capitalize">{pay.paymentMethod.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-on-surface-variant">{new Date(pay.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  {pay.referenceId && <p className="mb-2 text-xs text-on-surface-variant">Ref: {pay.referenceId}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-600">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-amber-700">Outstanding: ₹{Number(pay.runningOutstanding ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <th className="pb-3 text-left">Date</th>
                  <th className="pb-3 text-left">Method</th>
                  <th className="pb-3 text-left">Reference</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Outstanding After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(p.paymentLedger ?? p.payments ?? []).map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3 text-on-surface-variant">{new Date(pay.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3">{pay.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-on-surface-variant">{pay.referenceId ?? '—'}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-semibold text-amber-700">₹{Number(pay.runningOutstanding ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
