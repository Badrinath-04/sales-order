import { useCallback, useEffect, useMemo, useState } from 'react'
import { publishersApi, branchesApi, metaApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

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
  /** branchId -> qty string */
  const [distribution, setDistribution] = useState({})

  const fetchBranches = useCallback(() => branchesApi.list(), [])
  const { data: branchesPayload } = useApi(fetchBranches, null, [])
  const branches = Array.isArray(branchesPayload) ? branchesPayload : (branchesPayload?.data ?? [])

  const fetchCatalog = useCallback(() => metaApi.catalog(), [])
  const { data: catalog } = useApi(fetchCatalog, null, [])
  const paymentMethodOpts = catalog?.paymentMethods ?? []

  useEffect(() => {
    if (!branches.length) return
    setDistribution((prev) => {
      const next = { ...prev }
      for (const b of branches) {
        if (next[b.id] === undefined) next[b.id] = ''
      }
      return next
    })
  }, [branches])

  function setField(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function updateDistribution(branchId, value) {
    setDistribution((d) => ({ ...d, [branchId]: value }))
  }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.ratePerUnit) || 0)
  const qty = parseInt(form.quantity || '0', 10) || 0
  const allocated = useMemo(() => {
    let s = 0
    for (const b of branches) {
      s += parseInt(distribution[b.id] || '0', 10) || 0
    }
    return s
  }, [branches, distribution])

  const allocationMatches = allocated === qty

  function applyEvenSplit() {
    if (qty <= 0 || !branches.length) return
    const n = branches.length
    const each = Math.floor(qty / n)
    let rem = qty - each * n
    const next = {}
    for (const b of branches) {
      next[b.id] = String(each + (rem > 0 ? 1 : 0))
      if (rem > 0) rem -= 1
    }
    setDistribution(next)
  }

  function applyAllToFirst() {
    if (!branches.length) return
    const next = Object.fromEntries(branches.map((b) => [b.id, '0']))
    next[branches[0].id] = String(Math.max(qty, 0))
    setDistribution(next)
  }

  function clearAllocation() {
    setDistribution(Object.fromEntries(branches.map((b) => [b.id, '0'])))
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
      const distPayload = {}
      for (const b of branches) {
        distPayload[b.id] = Number(distribution[b.id] || 0)
      }
      await publishersApi.createProcurement({
        ...form,
        quantity: Number(form.quantity),
        ratePerUnit: Number(form.ratePerUnit),
        amountPaid: Number(form.amountPaid || 0),
        distribution: distPayload,
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
            <select value={form.publisherId} onChange={(e) => setField('publisherId', e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">— Select Publisher —</option>
              {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)}
                title="Procurement date"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Product / Book Label *</label>
            <input type="text" value={form.productLabel} onChange={(e) => setField('productLabel', e.target.value)}
              placeholder="e.g. Class 1 Textbooks" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)}
                placeholder="e.g. 500"
                title="Total units purchased"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Rate / Unit (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.ratePerUnit} onChange={(e) => setField('ratePerUnit', e.target.value)}
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
              <button type="button" onClick={applyEvenSplit}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low">
                Split evenly
              </button>
              <button type="button" onClick={applyAllToFirst}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low">
                All to first branch
              </button>
              <button type="button" onClick={clearAllocation}
                className="rounded-full border border-outline-variant/30 bg-white px-3 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container-low">
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {branches.map((b) => (
                <div key={b.id}>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant">{b.name}</label>
                  <input
                    type="number"
                    min="0"
                    value={distribution[b.id] ?? ''}
                    onChange={(e) => updateDistribution(b.id, e.target.value)}
                    placeholder="Units"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
            </div>
            <p className={`mt-2 text-xs font-semibold ${allocationMatches ? 'text-on-surface-variant' : 'text-error'}`}>
              {allocated} units allocated of {qty} total
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Quantities are keyed to live branches from Branch settings.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => setField('paymentMethod', e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— None —</option>
                {paymentMethodOpts.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Amount Paid (₹)</label>
              <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={(e) => setField('amountPaid', e.target.value)}
                placeholder="0.00 if unpaid"
                title="Amount already paid (₹)"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setField('notes', e.target.value)}
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
