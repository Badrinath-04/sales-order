import { useCallback, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { publishersApi, branchesApi } from '@/services/api'

const PAYMENT_METHODS = ['CASH', 'ONLINE', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'GPAY', 'PHONEPE', 'PAYTM', 'OTHER']

export default function AddProcurementPanel({ publishers, defaultPublisherId, onClose, onSaved }) {
  const [form, setForm] = useState({
    publisherId: defaultPublisherId ?? '',
    branchId: '',
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

  const fetchBranches = useCallback(() => branchesApi.list(), [])
  const { data: branchesData } = useApi(fetchBranches, null, [])
  const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.ratePerUnit) || 0)

  async function handleSave() {
    setError('')
    if (!form.publisherId || !form.branchId || !form.date || !form.productLabel || !form.quantity || !form.ratePerUnit) {
      setError('All required fields must be filled.')
      return
    }
    setSaving(true)
    try {
      await publishersApi.createProcurement({ ...form, quantity: Number(form.quantity), ratePerUnit: Number(form.ratePerUnit), amountPaid: Number(form.amountPaid || 0) })
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
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Branch *</label>
              <select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— Select Branch —</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Date *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
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
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Rate / Unit (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.ratePerUnit} onChange={(e) => set('ratePerUnit', e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Total (₹)</label>
              <input type="text" value={total > 0 ? `₹${total.toLocaleString('en-IN')}` : ''} readOnly
                className="w-full rounded-xl border-none bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary cursor-not-allowed" />
            </div>
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
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
