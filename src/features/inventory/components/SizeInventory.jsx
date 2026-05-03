import { useMemo, useState } from 'react'
import { inventoryApi } from '@/services/api'
import StockAdjustPanel from './StockAdjustPanel'
import StockLogDrawer from './StockLogDrawer'

export default function SizeInventory({
  categoryLabel,
  categoryIcon,
  rows,
  canManageStock,
  canBulkEditStock,
  canCreateProducts,
  canViewLogs,
  branchId,
  loading,
  onOpenBulkEdit,
  onOpenEditProduct,
}) {
  const [stockOverrides, setStockOverrides] = useState({})
  const [adjustingRow, setAdjustingRow] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [logItemId, setLogItemId] = useState(null)

  const localRows = useMemo(
    () => rows.map((r) => ({ ...r, stock: stockOverrides[r.id] ?? r.stock, stockLabel: `${(stockOverrides[r.id] ?? r.stock).toLocaleString('en-US')} Units` })),
    [rows, stockOverrides],
  )

  const handleSaveAdjustment = async ({ action, quantity, reason }) => {
    const row = adjustingRow
    const newQty =
      action === 'add'    ? row.stock + quantity :
      action === 'deduct' ? row.stock - quantity :
      quantity

    await inventoryApi.updateUniformStock(row.sizeId, {
      branchId,
      quantity: Math.max(newQty, 0),
      notes: reason,
      changeType: action === 'add' ? 'INCOMING' : action === 'deduct' ? 'OUTGOING' : 'ADJUSTMENT',
    })

    setStockOverrides((prev) => ({ ...prev, [row.id]: Math.max(newQty, 0) }))
  }

  if (loading) {
    return <p className="py-8 text-sm text-on-surface-variant">Loading sizes…</p>
  }

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-4 shadow-sm md:p-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-8 w-1 flex-shrink-0 rounded-full bg-primary" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined flex-shrink-0 text-on-surface-variant">{categoryIcon ?? 'apparel'}</span>
            <h3 className="font-headline text-base font-bold md:text-xl">{categoryLabel} Kit Details</h3>
          </div>
        </div>
        {/* Action buttons: scrollable pill row on mobile */}
        <div className="flex flex-shrink-0 gap-1 overflow-x-auto md:gap-2">
          {canCreateProducts && (
            <button type="button" onClick={onOpenEditProduct} className="flex-shrink-0 rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest md:px-4 md:py-2">
              Edit Product
            </button>
          )}
          {canBulkEditStock && (
            <button type="button" onClick={onOpenBulkEdit} className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 md:px-4 md:py-2">
              Bulk Edit
            </button>
          )}
          {canViewLogs && (
            <button type="button" onClick={() => { setLogItemId(null); setShowLog(true) }} className="flex-shrink-0 rounded-full bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest md:px-4 md:py-2">
              History
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {/* Desktop table header — hidden on mobile */}
        <div className="hidden grid-cols-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-outline md:grid">
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
            <div key={row.id}>
              {/* Mobile card view */}
              <div className={`flex flex-col gap-2 rounded-2xl p-3 md:hidden ${isLow ? 'bg-surface-container-low ring-1 ring-error/20' : 'bg-surface-container-low'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-bold shadow-sm ${isLow ? 'bg-white text-error' : 'bg-white text-primary'}`}>
                    {row.code}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="font-bold text-on-surface">{row.name}</span>
                    {row.alertLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-tight text-error">{row.alertLabel}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-bold ${isLow ? 'text-error' : 'text-on-surface-variant'}`}>{row.stockLabel}</span>
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-sm font-bold text-primary">{row.priceLabel}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {canViewLogs && (
                    <button
                      type="button"
                      onClick={() => { setLogItemId(row.sizeId); setShowLog(true) }}
                      className="rounded-xl border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                    >
                      Logs
                    </button>
                  )}
                  {canManageStock ? (
                    <button
                      type="button"
                      onClick={() => setAdjustingRow(row)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 ${
                        isLow ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden>tune</span>
                      Adjust Stock
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Desktop table row — hidden on mobile */}
              <div
                className={`hidden grid-cols-4 items-center rounded-2xl px-6 py-5 transition-all group hover:bg-surface-container hover:shadow-md md:grid ${
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
                <div className="flex justify-end gap-2">
                  {canViewLogs && (
                    <button
                      type="button"
                      onClick={() => { setLogItemId(row.sizeId); setShowLog(true) }}
                      className="rounded-xl border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                    >
                      Logs
                    </button>
                  )}
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
                  ) : <span className="text-xs text-on-surface-variant">—</span>}
                </div>
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
      {showLog && canViewLogs && (
        <StockLogDrawer
          {...(branchId ? { branchId } : {})}
          itemType="UNIFORM"
          itemId={logItemId}
          onClose={() => setShowLog(false)}
        />
      )}
    </div>
  )
}
