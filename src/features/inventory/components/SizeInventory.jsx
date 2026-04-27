import { useState } from 'react'
import { inventoryApi } from '@/services/api'
import StockAdjustPanel from './StockAdjustPanel'

export default function SizeInventory({ categoryLabel, rows, canManageStock, branchId, loading }) {
  const [localRows, setLocalRows] = useState(() => rows.map((r) => ({ ...r })))
  const [adjustingRow, setAdjustingRow] = useState(null)

  // Sync when rows prop changes (category switch)
  useState(() => { setLocalRows(rows.map((r) => ({ ...r }))) })

  const handleSaveAdjustment = async ({ action, quantity, reason, afterQty }) => {
    const row = adjustingRow
    const newQty =
      action === 'add'    ? row.stock + quantity :
      action === 'deduct' ? row.stock - quantity :
      quantity

    await inventoryApi.updateUniformStock(row.sizeId, {
      branchId,
      quantity: Math.max(newQty, 0),
      notes: reason,
    })

    setLocalRows((prev) => prev.map((r) =>
      r.id === row.id
        ? { ...r, stock: afterQty, stockLabel: `${Math.max(afterQty, 0).toLocaleString()} Units`, tone: afterQty < 20 ? 'low' : 'normal', alertLabel: afterQty < 20 ? 'Low Stock Alert' : undefined }
        : r,
    ))
  }

  if (loading) {
    return <p className="py-8 text-sm text-on-surface-variant">Loading sizes…</p>
  }

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h3 className="font-headline text-xl font-bold">Size Inventory: {categoryLabel}</h3>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest">
            Export CSV
          </button>
          <button type="button" className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest">
            History
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-outline">
          <div>Size Variant</div>
          <div className="text-center">Available Stock</div>
          <div className="text-center">Price (Unit)</div>
          <div className="text-right">Quick Action</div>
        </div>

        {localRows.length === 0 && (
          <p className="py-4 text-sm text-on-surface-variant">No sizes found.</p>
        )}

        {localRows.map((row) => {
          const isLow = row.tone === 'low' || row.tone === 'critical'
          return (
            <div
              key={row.id}
              className={`grid grid-cols-4 items-center rounded-2xl px-6 py-5 transition-all group hover:bg-surface-container hover:shadow-md ${
                isLow ? 'bg-surface-container-low ring-1 ring-error/20' : 'bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold shadow-sm ${isLow ? 'bg-white text-error' : 'bg-white text-primary'}`}>
                  {row.code}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">{row.name}</span>
                  {row.alertLabel && (
                    <span className="text-[10px] font-bold uppercase tracking-tight text-error">{row.alertLabel}</span>
                  )}
                </div>
              </div>
              <div className={`text-center font-extrabold ${isLow ? 'text-error' : 'text-on-surface-variant'}`}>
                {row.stockLabel}
              </div>
              <div className="text-center">
                <span className="rounded-full bg-primary/5 px-3 py-1 text-sm font-bold text-primary">{row.priceLabel}</span>
              </div>
              <div className="text-right">
                {canManageStock ? (
                  <button
                    type="button"
                    onClick={() => setAdjustingRow(row)}
                    className={`ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 ${
                      isLow ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>tune</span>
                    Adjust Stock
                  </button>
                ) : (
                  <span className="text-xs text-on-surface-variant">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {adjustingRow && canManageStock && (
        <StockAdjustPanel
          item={{ label: `${categoryLabel} — ${adjustingRow.name}`, price: adjustingRow.price, sizeId: adjustingRow.sizeId }}
          currentStock={adjustingRow.stock}
          onClose={() => setAdjustingRow(null)}
          onSave={handleSaveAdjustment}
        />
      )}
    </div>
  )
}
