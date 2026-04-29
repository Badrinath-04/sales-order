import { useState } from 'react'
import { useToast } from '@/context/ToastContext'

const ACTIONS = [
  { id: 'add',      label: 'Add Stock',            icon: 'add_box',        color: 'text-green-700 bg-green-50 border-green-200' },
  { id: 'deduct',   label: 'Manual Deduction',      icon: 'remove_circle',  color: 'text-error bg-error-container/40 border-error/20' },
  { id: 'override', label: 'Correct / Override',    icon: 'edit_square',    color: 'text-primary bg-primary/5 border-primary/20' },
]

export default function StockAdjustPanel({ item, currentStock, onClose, onSave, panelTabs }) {
  const toast = useToast()
  const [action, setAction] = useState('add')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const quantity = qty === '' ? NaN : Number(qty)
  const isValid = !Number.isNaN(quantity) && quantity >= 0 && (action !== 'deduct' || reason.trim())
  const afterQty = Number.isNaN(quantity)
    ? currentStock
    : action === 'add'    ? currentStock + quantity
    : action === 'deduct' ? currentStock - quantity
    : quantity  // override

  const isNegative = afterQty < 0

  const handleSave = async () => {
    if (!isValid) return
    if (isNegative) {
      const confirmed = window.confirm(`This will result in negative stock (${afterQty} units). Continue?`)
      if (!confirmed) return
    }
    setSaving(true)
    try {
      await onSave({ action, quantity: Math.floor(quantity), reason: reason.trim() || undefined, afterQty })
      toast.success('Stock updated successfully')
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Stock update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface">Adjust Stock</h2>
            <p className="mt-0.5 text-sm font-medium text-on-surface-variant">{item.label}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-container-low">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        {panelTabs && (
          <div className="flex gap-2 border-b border-outline-variant/10 px-6 py-3">
            {panelTabs.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => panelTabs.onTabChange?.(tab.id)}
                disabled={tab.disabled}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  panelTabs.activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* Item summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Current Stock</p>
              <p className={`mt-1 text-2xl font-extrabold ${currentStock < 20 ? 'text-error' : 'text-on-surface'}`}>
                {currentStock.toLocaleString()}
              </p>
            </div>
            {item.price !== undefined && (
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Unit Price</p>
                <p className="mt-1 text-2xl font-extrabold text-primary">
                  ₹{Number(item.price).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Action selector */}
          <div>
            <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Action</p>
            <div className="space-y-2">
              {ACTIONS.map((a) => (
                <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${action === a.id ? a.color : 'border-outline-variant/20 hover:bg-surface-container-low'}`}>
                  <input type="radio" className="sr-only" checked={action === a.id} onChange={() => setAction(a.id)} />
                  <span className="material-symbols-outlined text-xl" aria-hidden>{a.icon}</span>
                  <span className="text-sm font-semibold">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {action === 'override' ? 'Set Stock To' : 'Quantity'}
            </label>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={action === 'override' ? 'Enter exact stock count' : 'Enter quantity'}
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Result preview */}
          {!Number.isNaN(quantity) && qty !== '' && (
            <div className={`rounded-xl border p-4 ${isNegative ? 'border-error/30 bg-error-container/30' : 'border-outline-variant/10 bg-surface-container-low'}`}>
              <p className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">After Adjustment</p>
              <p className={`mt-1 text-2xl font-extrabold ${isNegative ? 'text-error' : 'text-primary'}`}>
                {afterQty.toLocaleString()} units
              </p>
              {isNegative && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-error">
                  <span className="material-symbols-outlined text-sm" aria-hidden>warning</span>
                  This will result in negative stock — you'll be asked to confirm.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Reason / Note {action === 'deduct' || action === 'override' ? <span className="text-error">*</span> : '(optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. New shipment received, Damaged items removed, Correction entry…"
              className="w-full resize-none rounded-xl border border-outline-variant/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {action !== 'add' && !reason.trim() && (
              <p className="mt-1 text-xs text-error">Reason is required for deductions and overrides</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant/10 p-6">
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="button" disabled={saving || !isValid} onClick={handleSave}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Adjustment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
