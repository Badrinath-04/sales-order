import { useState } from 'react'
import { publishersApi } from '@/services/api'

const PAYMENT_METHODS = ['CASH', 'ONLINE', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'PHONEPE', 'PAYTM', 'OTHER']

export default function AddProcurementPanel({ publishers, defaultPublisherId, onClose, onSaved }) {
  const [form, setForm] = useState({
    publisherId: defaultPublisherId ?? '',
    date: new Date().toISOString().slice(0, 10),
    productLabel: '',
    quantity: '',
    ratePerUnit: '',
    paymentMethod: '',
    amountPaid: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [distribution, setDistribution] = useState({ darga: '', narsingi: '', sheikpet: '' })

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function updateDistribution(field, value) { setDistribution((d) => ({ ...d, [field]: value })) }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.ratePerUnit) || 0)
  const qty = parseInt(form.quantity || '0', 10) || 0
  const allocated =
    (parseInt(distribution.darga || '0', 10) || 0) +
    (parseInt(distribution.narsingi || '0', 10) || 0) +
    (parseInt(distribution.sheikpet || '0', 10) || 0)
  const allocationMatches = allocated === qty

  function applyEvenSplit() {
    if (qty <= 0) return
    const each = Math.floor(qty / 3)
    const remainder = qty - (each * 3)
    setDistribution({
      darga: String(each + (remainder > 0 ? 1 : 0)),
      narsingi: String(each + (remainder > 1 ? 1 : 0)),
      sheikpet: String(each),
    })
  }

  function applyAllToDarga() {
    setDistribution({
      darga: String(Math.max(qty, 0)),
      narsingi: '0',
      sheikpet: '0',
    })
  }

  function clearAllocation() {
    setDistribution({ darga: '0', narsingi: '0', sheikpet: '0' })
  }

  async function handleSave() {
    setError('')
    if (!form.publisherId || !form.date || !form.productLabel || !form.quantity || !form.ratePerUnit) {
      setError('All required fields must be filled.')
      return
    }
    if (!allocationMatches) {
      setError(`Distribution must match total quantity (${allocated}/${qty}).`)
      return
    }
    setSaving(true)
    try {
      await publishersApi.createProcurement({
        ...form,
        quantity: Number(form.quantity),
        ratePerUnit: Number(form.ratePerUnit),
        amountPaid: Number(form.amountPaid || 0),
        distribution: {
          darga: Number(distribution.darga || 0),
          narsingi: Number(distribution.narsingi || 0),
          sheikpet: Number(distribution.sheikpet || 0),
        },
      })
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save procurement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-100 p-8">
          <h2 className="font-headline text-xl font-bold">Log Procurement</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Publisher *</label>
            <select value={form.publisherId} onChange={(e) => set('publisherId', e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">— Select Publisher —</option>
              {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Date *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                title="Procurement date"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Product / Book Label *</label>
            <input type="text" value={form.productLabel} onChange={(e) => set('productLabel', e.target.value)}
              placeholder="e.g. Class 1 Textbooks" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                placeholder="e.g. 500"
                title="Total units purchased"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Rate / Unit (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.ratePerUnit} onChange={(e) => set('ratePerUnit', e.target.value)}
                placeholder="e.g. 249.50"
                title="Cost per unit (₹)"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Total (₹)</label>
              <input type="text" value={total > 0 ? `₹${total.toLocaleString('en-IN')}` : ''} readOnly
                placeholder="Qty × rate"
                title="Quantity × rate per unit"
                className="w-full rounded-xl border-none bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary cursor-not-allowed placeholder:text-primary/50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Distribute stock across branches</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyEvenSplit}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low"
              >
                Split Evenly
              </button>
              <button
                type="button"
                onClick={applyAllToDarga}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low"
              >
                All to Darga
              </button>
              <button
                type="button"
                onClick={clearAllocation}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min="0"
                value={distribution.darga}
                onChange={(e) => updateDistribution('darga', e.target.value)}
                placeholder="Darga units"
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                min="0"
                value={distribution.narsingi}
                onChange={(e) => updateDistribution('narsingi', e.target.value)}
                placeholder="Narsingi units"
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                min="0"
                value={distribution.sheikpet}
                onChange={(e) => updateDistribution('sheikpet', e.target.value)}
                placeholder="Sheikpet units"
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className={`mt-2 text-xs font-semibold ${allocationMatches ? 'text-on-surface-variant' : 'text-error'}`}>
              {allocated} units allocated of {qty} total
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Stock can be distributed to branches later via Stock Management.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— None —</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount Paid (₹)</label>
              <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={(e) => set('amountPaid', e.target.value)}
                placeholder="0.00 if unpaid"
                title="Amount already paid (₹)"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Partial payment, balance by 30th…"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-100 px-8 pb-8 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Log Procurement'}
          </button>
        </div>
      </div>
    </div>
  )
}
