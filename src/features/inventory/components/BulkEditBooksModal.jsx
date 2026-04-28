import { useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'

export default function BulkEditBooksModal({ branchId, branches = [], selectedGrade, selectedClassLabel, classList, kitOverride, onClose }) {
  const toast = useToast()
  const classTitle = selectedClassLabel ?? `Class ${selectedGrade}`
  const [modalBranchId, setModalBranchId] = useState(branchId ?? 'ALL')

  // Build a flat list of all kit items from the selected grade (all sections share same kit)
  const kitItems = useMemo(() => {
    if (kitOverride?.items?.length) {
      return kitOverride.items.map((item) => {
        const stocks = item.bookStocks ?? []
        const stockEntry = stocks.find((s) => modalBranchId !== 'ALL' && s.branchId === modalBranchId)
        const combinedStock = stocks.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0)
        return {
          id: item.id,
          itemId: item.id,
          label: item.label,
          icon: item.icon ?? 'menu_book',
          stock: modalBranchId === 'ALL' ? combinedStock : (stockEntry?.quantity ?? 0),
          price: Number(item.price),
        }
      })
    }
    const cls = classList.find((c) => c.grade === selectedGrade && c.section === 'A') ?? classList[0]
    if (!cls?.bookKit?.items) return []
    return cls.bookKit.items.map((item) => {
      const stocks = item.bookStocks ?? []
      const stockEntry = stocks.find((s) => modalBranchId !== 'ALL' && s.branchId === modalBranchId)
      const combinedStock = stocks.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0)
      return {
        id: item.id,
        itemId: item.id,
        label: item.label,
        icon: item.icon ?? 'menu_book',
        stock: modalBranchId === 'ALL' ? combinedStock : (stockEntry?.quantity ?? 0),
        price: Number(item.price),
      }
    })
  }, [classList, selectedGrade, modalBranchId, kitOverride])

  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(kitItems.map((i) => [i.id, String(i.stock)])),
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const setDraft = (id, val) => setDrafts((d) => ({ ...d, [id]: val }))

  useEffect(() => {
    setDrafts(Object.fromEntries(kitItems.map((i) => [i.id, String(i.stock)])))
  }, [kitItems])

  const changedItems = kitItems.filter((item) => {
    const draft = Number(drafts[item.id])
    return !Number.isNaN(draft) && draft !== item.stock
  })

  const handleSave = async () => {
    if (modalBranchId === 'ALL') return
    if (changedItems.length === 0) { onClose(); return }
    setSaving(true)
    try {
      await Promise.all(
        changedItems.map((item) =>
          inventoryApi.updateBookStock(item.itemId, {
            branchId: modalBranchId,
            quantity: Math.max(0, Math.floor(Number(drafts[item.id]))),
            notes: reason || `Bulk update — ${classTitle}`,
          }),
        ),
      )
      toast.success(`${changedItems.length} item${changedItems.length > 1 ? 's' : ''} updated successfully`)
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
              Bulk Edit — {classTitle} Kit
            </h2>
            <p className="text-sm text-on-surface-variant">
              Edit stock quantities for all items at once
            </p>
            <div className="mt-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Branch</label>
              <select
                value={modalBranchId}
                onChange={(e) => setModalBranchId(e.target.value)}
                className="rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
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
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Item</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Unit Price</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Stock</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">New Stock</th>
                <th className="px-6 py-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {kitItems.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">No items in this kit.</td></tr>
              ) : (
                kitItems.map((item) => {
                  const newVal = Number(drafts[item.id])
                  const delta = Number.isNaN(newVal) ? 0 : newVal - item.stock
                  const changed = !Number.isNaN(newVal) && newVal !== item.stock
                  return (
                    <tr key={item.id} className={changed ? 'bg-primary/[0.03]' : ''}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-outline" aria-hidden>{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">₹{item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-on-surface">{item.stock.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          value={drafts[item.id]}
                          onChange={(e) => setDraft(item.id, e.target.value)}
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
              {modalBranchId === 'ALL'
                ? 'Please select a specific branch to apply bulk changes.'
                : changedItems.length > 0
                ? <span className="font-bold text-primary">{changedItems.length} item{changedItems.length > 1 ? 's' : ''} changed</span>
                : 'No changes yet'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-outline-variant/30 px-6 py-2.5 text-sm font-semibold hover:bg-surface-container-low">
                Cancel
              </button>
              <button type="button" disabled={saving || changedItems.length === 0 || modalBranchId === 'ALL'} onClick={handleSave}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : `Save ${changedItems.length || ''} Changes`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
