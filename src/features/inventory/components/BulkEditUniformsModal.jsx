import { useState } from 'react'
import { inventoryApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function BulkEditUniformsModal({ branchId, categoryLabel, rows, onClose }) {
  const toast = useToast()

  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(rows.map((r) => [r.id, String(r.stock)])),
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const setDraft = (id, val) => setDrafts((d) => ({ ...d, [id]: val }))

  const changedRows = rows.filter((row) => {
    const draft = Number(drafts[row.id])
    return !Number.isNaN(draft) && draft !== row.stock
  })

  const handleSave = async () => {
    if (changedRows.length === 0) { onClose(); return }
    setSaving(true)
    try {
      await Promise.all(
        changedRows.map((row) =>
          inventoryApi.updateUniformStock(row.sizeId, {
            branchId,
            quantity: Math.max(0, Math.floor(Number(drafts[row.id]))),
            notes: reason || `Bulk update — ${categoryLabel}`,
          }),
        ),
      )
      toast.success(`${changedRows.length} size${changedRows.length > 1 ? 's' : ''} updated successfully`)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Bulk update failed')
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
            <h2 className="font-headline text-xl font-extrabold text-on-surface">
              Bulk Edit — {categoryLabel} Sizes
            </h2>
            <p className="text-sm text-on-surface-variant">Edit stock quantities for all sizes at once</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-container-low">
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Size</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Price</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Stock</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">New Stock</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">No sizes found.</td></tr>
              ) : (
                rows.map((row) => {
                  const newVal = Number(drafts[row.id])
                  const delta = Number.isNaN(newVal) ? 0 : newVal - row.stock
                  const changed = !Number.isNaN(newVal) && newVal !== row.stock
                  const isLow = row.tone === 'low' || row.tone === 'critical'
                  return (
                    <tr key={row.id} className={changed ? 'bg-primary/[0.03]' : ''}>
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
                      <td className="px-6 py-4 text-on-surface-variant">{row.priceLabel}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLow ? 'text-error' : 'text-on-surface'}`}>
                          {row.stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          value={drafts[row.id]}
                          onChange={(e) => setDraft(row.id, e.target.value)}
                          className="w-28 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {changed && (
                          <span className={`font-bold ${delta > 0 ? 'text-green-700' : 'text-error'}`}>
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {changedRows.length > 0
                ? <span className="font-bold text-primary">{changedRows.length} size{changedRows.length > 1 ? 's' : ''} changed</span>
                : 'No changes yet'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">
                Cancel
              </button>
              <button type="button" disabled={saving || changedRows.length === 0} onClick={handleSave}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : `Save ${changedRows.length || ''} Changes`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
