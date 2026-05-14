import { useState } from 'react'
import { inventoryApi } from '@/services/api'

const MODES = [
  { value: 'add', label: 'Add Stock', icon: 'add_circle' },
  { value: 'deduct', label: 'Deduct Stock', icon: 'remove_circle' },
  { value: 'override', label: 'Override (Correct)', icon: 'published_with_changes' },
]

export default function BulkEditClassStockModal({ kit, branchId, lines, onClose, onSave }) {
  const [mode, setMode] = useState('add')
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(() => Object.fromEntries(lines.map((l) => [l.itemId, false])))
  const [deltas, setDeltas] = useState(() => Object.fromEntries(lines.map((l) => [l.itemId, ''])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const allChecked = lines.length > 0 && lines.every((l) => checked[l.itemId])
  const someChecked = lines.some((l) => checked[l.itemId])

  function toggleAll(e) {
    const val = e.target.checked
    setChecked(Object.fromEntries(lines.map((l) => [l.itemId, val])))
  }

  function previewQty(line) {
    const delta = parseInt(deltas[line.itemId] || '0', 10)
    if (!checked[line.itemId] || isNaN(delta) || delta === 0) return line.stock
    if (mode === 'add') return line.stock + delta
    if (mode === 'deduct') return Math.max(line.stock - delta, 0)
    return delta
  }

  async function handleSave() {
    setError('')
    if ((mode === 'deduct' || mode === 'override') && !reason.trim()) {
      setError('Reason is required for deduct and override.')
      return
    }
    const items = lines
      .filter((l) => checked[l.itemId])
      .map((l) => ({ bookItemId: l.itemId, delta: parseInt(deltas[l.itemId] || '0', 10) }))
      .filter((i) => !isNaN(i.delta) && i.delta >= 0)

    if (items.length === 0) {
      setError('Select at least one item with a valid quantity.')
      return
    }

    setSaving(true)
    try {
      const { data } = await inventoryApi.bulkAdjustBookStock({ branchId, mode, reason: reason || undefined, items })
      const updates = (data?.data ?? data) || []
      onSave(updates)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk Edit Class Stock"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 p-8">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Bulk Edit Class Stock</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {kit?.class?.label ?? 'Class'} — {branchId ? 'Branch' : 'All Branches'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 px-8 pt-6">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                mode === m.value
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Reason field */}
        <div className="px-8 pt-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
            Reason / Note {(mode === 'deduct' || mode === 'override') ? '(required)' : '(optional)'}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. New shipment received, Stock correction…"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Product table */}
        <div className="flex-1 overflow-y-auto px-8 pt-4 pb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 text-left">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="accent-primary"
                    aria-label="Select all"
                  />
                </th>
                <th className="pb-3 text-left">Product</th>
                <th className="pb-3 text-center">Current Stock</th>
                <th className="pb-3 text-center">{mode === 'override' ? 'New Value' : 'Delta'}</th>
                <th className="pb-3 text-center">New Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {lines.map((line) => {
                const isChecked = checked[line.itemId]
                const preview = previewQty(line)
                const delta = parseInt(deltas[line.itemId] || '0', 10)
                const changed = isChecked && !isNaN(delta) && delta !== 0
                return (
                  <tr key={line.itemId} className={isChecked ? 'bg-primary/5' : ''}>
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setChecked((p) => ({ ...p, [line.itemId]: e.target.checked }))}
                        className="accent-primary"
                      />
                    </td>
                    <td className="py-3 font-medium text-on-surface">{line.label}</td>
                    <td className="py-3 text-center text-on-surface-variant">{line.stock.toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={!isChecked}
                        value={deltas[line.itemId]}
                        onChange={(e) => setDeltas((p) => ({ ...p, [line.itemId]: e.target.value }))}
                        className="w-24 rounded-lg border border-outline-variant/30 bg-white px-3 py-1.5 text-center text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="0"
                      />
                    </td>
                    <td className={`py-3 text-center font-bold ${changed ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {isChecked ? preview.toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 p-8">
          {error && <p className="mb-4 rounded-xl bg-error/10 px-4 py-2 text-sm font-medium text-error">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {someChecked
                ? `${lines.filter((l) => checked[l.itemId]).length} product(s) selected`
                : 'No changes yet'}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !someChecked}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Apply Bulk Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
