import { useCallback, useState } from 'react'
import { publishersApi, metaApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function AddPaymentPanel({ publisherId, publisherName, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    paymentMethod: 'CASH',
    referenceId: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCatalog = useCallback(() => metaApi.catalog(), [])
  const { data: catalog } = useApi(fetchCatalog, null, [])
  const paymentMethodOpts = catalog?.paymentMethods ?? []

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError('')
    if (!form.date || !form.amount || !form.paymentMethod) { setError('Date, amount, and payment method are required.'); return }
    setSaving(true)
    try {
      await publishersApi.addPayment(publisherId, { ...form, amount: Number(form.amount) })
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-8">
          <div>
            <h2 className="font-headline text-xl font-bold">Add Payment</h2>
            <p className="text-sm text-on-surface-variant">{publisherName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4 p-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Date *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                title="Payment date"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                placeholder="e.g. 15000.00"
                title="Payment amount in rupees"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Payment Method *</label>
            <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              {paymentMethodOpts.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Reference / UTR No.</label>
            <input type="text" value={form.referenceId} onChange={(e) => set('referenceId', e.target.value)}
              placeholder="Optional transaction reference"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-100 px-8 pb-8 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
