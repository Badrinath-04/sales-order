import { useState } from 'react'
import { inventoryApi } from '@/services/api'

const MODES = [
  { value: 'add', label: 'Add Stock', icon: 'add_circle' },
  { value: 'deduct', label: 'Deduct Stock', icon: 'remove_circle' },
  { value: 'override', label: 'Override (Correct)', icon: 'published_with_changes' },
]

export default function BulkEditUniformsModal({ branchId, categoryLabel, rows, onClose, onSave }) {
  const [mode, setMode] = useState('add')
  const [checked, setChecked] = useState(() => Object.fromEntries(rows.map((r) => [r.id, false])))
  const [deltas, setDeltas] = useState(() => Object.fromEntries(rows.map((r) => [r.id, ''])))
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id])
  const someChecked = rows.some((r) => checked[r.id])

  function toggleAll(e) {
    const val = e.target.checked
    setChecked(Object.fromEntries(rows.map((r) => [r.id, val])))
  }

  function previewQty(row) {
    const delta = parseInt(deltas[row.id] || '0', 10)
    if (!checked[row.id] || Number.isNaN(delta) || delta === 0) return row.stock
    if (mode === 'add') return row.stock + delta
    if (mode === 'deduct') return Math.max(row.stock - delta, 0)
    return Math.max(delta, 0)
  }

  const handleSave = async () => {
    setError('')
    if ((mode === 'deduct' || mode === 'override') && !reason.trim()) {
      setError('Reason is required for deduct and override.')
      return
    }
    const items = rows
      .filter((r) => checked[r.id])
      .map((r) => ({ sizeId: r.sizeId, delta: parseInt(deltas[r.id] || '0', 10) }))
      .filter((i) => !Number.isNaN(i.delta) && i.delta >= 0)
    if (items.length === 0) {
      setError('Select at least one size with a valid quantity.')
      return
    }

    setSaving(true)
    try {
      const { data } = await inventoryApi.bulkAdjustUniformStock({
        branchId,
        mode,
        reason: reason || undefined,
        items,
      })
      onSave?.(data?.data ?? data ?? [])
      onClose()
    } catch {
      setError('Bulk update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-5">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface">Bulk Edit Uniform Stock</h2>
            <p className="text-sm text-on-surface-variant">{categoryLabel} — per-size bulk adjustment</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-container-low">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary" aria-label="Select all sizes" />
                </th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Size</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Stock</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {mode === 'override' ? 'New Value' : 'Delta'}
                </th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">New Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">No sizes found.</td></tr>
              ) : (
                rows.map((row) => {
                  const isChecked = checked[row.id]
                  const preview = previewQty(row)
                  const isLow = row.tone === 'low' || row.tone === 'critical'
                  return (
                    <tr key={row.id} className={isChecked ? 'bg-primary/[0.03]' : ''}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setChecked((p) => ({ ...p, [row.id]: e.target.checked }))}
                          className="accent-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${isLow ? 'bg-error-container text-error' : 'bg-primary/10 text-primary'}`}>
                            {row.code}
                          </div>
                          <div>
                            <p className="font-semibold">{row.name}</p>
                            {row.alertLabel && <p className="text-[10px] font-bold text-error">{row.alertLabel}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLow ? 'text-error' : 'text-on-surface'}`}>
                          {row.stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          disabled={!isChecked}
                          value={deltas[row.id]}
                          onChange={(e) => setDeltas((p) => ({ ...p, [row.id]: e.target.value }))}
                          className="w-28 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {isChecked ? preview.toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reason + footer */}
        <div className="border-t border-outline-variant/10 p-6">
          <div className="mb-4">
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Reason / Note (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment received, Stock correction…"
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {error && (
            <p className="mb-3 rounded-xl bg-error/10 px-4 py-2 text-sm font-medium text-error">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {someChecked
                ? <span className="font-bold text-primary">{rows.filter((r) => checked[r.id]).length} size(s) selected</span>
                : 'No changes yet'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">
                Cancel
              </button>
              <button type="button" disabled={saving || !someChecked} onClick={handleSave}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : 'Apply Bulk Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
