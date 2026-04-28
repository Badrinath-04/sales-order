import { useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { usePermission } from '../../../hooks/usePermission'
import { inventoryApi } from '@/services/api'
import StockAdjustPanel from './StockAdjustPanel'
import StockLogDrawer from './StockLogDrawer'
import BulkEditClassStockModal from './BulkEditClassStockModal'
import CreateProductPanel from './CreateProductPanel'

const inputReadOnlyClass =
  'w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 cursor-not-allowed opacity-75'

function buildLinesFromKit(kit, branchId, branches = []) {
  if (!kit?.items?.length) return []
  return kit.items.map((item) => {
    const stocks = item.bookStocks ?? []
    const stockEntry = stocks.find((s) => branchId && s.branchId === branchId)
    const combinedStock = stocks.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0)
    const branchStocks = branches.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      quantity: Number(stocks.find((s) => s.branchId === b.id)?.quantity ?? 0),
    }))
    return {
      id: item.id,
      itemId: item.id,
      label: item.label,
      icon: item.icon ?? 'menu_book',
      stock: branchId ? (stockEntry?.quantity ?? 0) : combinedStock,
      openingPending: branchId ? !stockEntry : stocks.length === 0,
      price: Number(item.price),
      branchStocks,
      isArchived: Boolean(item.isArchived),
      // Pass full item data for edit panel
      _raw: item,
    }
  })
}

export default function KitDetails({ selectedClassId, selectedClassLabel, classData, branchId, branches = [], isSuperAdmin: isSuperAdminProp, onProductSaved }) {
  const { role } = useAdminSession()
  const isSuperAdmin = isSuperAdminProp ?? role === ROLES.SUPER_ADMIN
  const canCreateProducts = usePermission('canCreateProducts')
  const canUpdateStock = usePermission('canUpdateStock')
  const canAdjustStock = usePermission('canAdjustStock')
  const canViewLogs = usePermission('canViewStockLogs')
  const canAdjustStockForBranch = Boolean(branchId) && (isSuperAdmin || canAdjustStock)
  const canEditProducts = isSuperAdmin || canCreateProducts
  const canArchiveProducts = isSuperAdmin || (role === ROLES.SENIOR_ADMIN && canUpdateStock)

  const [adjustingLine, setAdjustingLine] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [logItemId, setLogItemId] = useState(null)
  const [logCatalogKey, setLogCatalogKey] = useState(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [stockOverrides, setStockOverrides] = useState({})
  const [showBranchPrompt, setShowBranchPrompt] = useState(false)

  const kit = classData?.bookKit
  const grade = selectedClassId !== undefined && selectedClassId !== null
    ? Number(selectedClassId) : null
  const hasSelectedClass = grade !== null && !Number.isNaN(grade)
  const classTitle = selectedClassLabel ?? (hasSelectedClass ? `Class ${grade}` : 'Class')
  const activeBranchName = branchId ? (branches.find((b) => b.id === branchId)?.name ?? 'Selected Branch') : ''

  const displayTitle = hasSelectedClass ? `${classTitle} Kit Details` : 'Kit Details'
  const badge = kit?.badge ?? (hasSelectedClass ? 'Academic Kit' : '')
  const lastUpdated = kit?.lastUpdated
    ? `Last updated: ${new Date(kit.lastUpdated).toLocaleDateString('en-GB').replace(/\//g, '/')}`
    : ''

  const baseLines = useMemo(() => buildLinesFromKit(kit, branchId, branches), [kit, branchId, branches])
  const lines = useMemo(
    () => baseLines.map((line) => ({
      ...line,
      stock: stockOverrides[line.itemId] ?? line.stock,
    })),
    [baseLines, stockOverrides],
  )
  const activeLines = useMemo(() => lines.filter((line) => !line.isArchived), [lines])
  const archivedLines = useMemo(() => lines.filter((line) => line.isArchived), [lines])

  const handleSaveAdjustment = async ({ action, quantity, reason }) => {
    const line = adjustingLine
    const newQty =
      action === 'add'    ? line.stock + quantity :
      action === 'deduct' ? line.stock - quantity :
      quantity

    await inventoryApi.updateBookStock(line.itemId, {
      branchId,
      quantity: Math.max(newQty, 0),
      notes: reason,
    })

    setStockOverrides((prev) => ({ ...prev, [line.itemId]: Math.max(newQty, 0) }))
  }

  const handleBulkSave = (updates) => {
    const map = {}
    updates.forEach(({ bookItemId, after }) => { map[bookItemId] = after })
    setStockOverrides((prev) => ({ ...prev, ...map }))
  }

  function handleProductEditSaved() {
    setEditingProduct(null)
    onProductSaved?.()
  }

  if (!kit && !hasSelectedClass) {
    return (
      <div className="col-span-12 lg:col-span-5">
        <div className="flex h-full items-center justify-center rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant">
          Select a class to view kit details.
        </div>
      </div>
    )
  }

  if (!kit) {
    return (
      <div className="col-span-12 lg:col-span-5">
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-stone-300" aria-hidden>library_books</span>
          <div>
            <p className="font-bold text-on-surface">No products configured</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              No kit configured for {classTitle}.
              {isSuperAdmin && " Click \"Add Product\" to get started."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-12 lg:col-span-5">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_12px_32px_rgba(27,28,28,0.06)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-8">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">{displayTitle}</h3>
            <p className="text-sm font-medium text-stone-500">{lastUpdated}</p>
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <div className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase text-on-primary-fixed-variant">
                {badge}
              </div>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-8">
          {activeLines.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-stone-300" aria-hidden>inventory_2</span>
              <div>
                <p className="font-bold text-on-surface">No products yet</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {isSuperAdmin
                    ? 'Click "Add Product" to configure this class kit.'
                    : 'No products configured for this class.'}
                </p>
              </div>
            </div>
          )}

          {activeLines.map((line) => {
            const isLow = line.stock < 20
            return (
              <div key={line.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-stone-400" aria-hidden>{line.icon}</span>
                    <span className="text-sm font-bold text-stone-700">{line.label}</span>
                    {/* Gear icon for Super Admin — edit product definition */}
                    {(canEditProducts || canArchiveProducts) && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct(line._raw)}
                        className="rounded-md p-0.5 text-stone-300 hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`Edit product settings for ${line.label}`}
                        title="Edit product settings"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden>settings</span>
                      </button>
                    )}
                    {canViewLogs && (branchId || (isSuperAdmin && !branchId)) && (
                      <button
                        type="button"
                        onClick={() => {
                          const raw = line._raw
                          setLogCatalogKey(raw?.catalogKey || null)
                          setLogItemId(raw?.catalogKey ? null : line.itemId)
                          setShowLog(true)
                        }}
                        className="rounded-md p-0.5 text-stone-300 hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label={`View stock logs for ${line.label}`}
                        title="View stock logs"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden>history</span>
                      </button>
                    )}
                  </div>
                  {(isSuperAdmin || canAdjustStock) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!branchId) {
                          setShowBranchPrompt(true)
                          return
                        }
                        setAdjustingLine(line)
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-outline-variant/20 bg-white px-2.5 py-1 text-xs font-semibold text-on-surface-variant shadow-sm hover:bg-surface-container-low hover:text-primary transition-colors"
                      aria-label={`Adjust stock for ${line.label}`}
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden>tune</span>
                      Adjust Stock
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Current Stock
                    </span>
                    <div className="relative">
                      <input
                        className={`${inputReadOnlyClass} ${isLow ? 'text-error' : ''}`}
                        type="number"
                        value={line.stock}
                        readOnly
                        aria-label={`Current stock: ${line.stock}`}
                      />
                      {isLow && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-error">
                          {line.openingPending ? 'Opening Pending' : 'Low'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Unit Price (₹)
                    </span>
                    <input
                      className={inputReadOnlyClass}
                      type="number"
                      step="0.01"
                      value={line.price}
                      readOnly
                      aria-label={`Unit price: ${line.price}`}
                    />
                  </div>
                </div>
                {isSuperAdmin && !branchId && (
                  <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Branch-wise Stock
                    </p>
                    {line.branchStocks.map((b) => (
                      <div key={`${line.itemId}-${b.branchId}`} className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{b.branchName}</span>
                        <span className="font-semibold text-on-surface">{b.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {canArchiveProducts && archivedLines.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Archived Products ({archivedLines.length})
              </p>
              <div className="space-y-2">
                {archivedLines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-400" aria-hidden>{line.icon}</span>
                      <span className="text-sm font-medium text-on-surface-variant">{line.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(line._raw)}
                      className="rounded-lg border border-outline-variant/30 bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/5"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 bg-stone-50 p-8">
          <div className="flex w-full gap-3">
            {canViewLogs && (branchId || (isSuperAdmin && !branchId)) && (
              <button
                type="button"
                onClick={() => {
                  setLogItemId(null)
                  setLogCatalogKey(null)
                  setShowLog(true)
                }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-white shadow-sm transition-colors hover:bg-surface-container-low text-on-surface-variant"
                title="View stock log"
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden>history</span>
              </button>
            )}
            <div className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-low text-sm font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-base" aria-hidden>info</span>
              {canAdjustStockForBranch
                ? 'Click "Adjust Stock" on each item to adjust'
                : (isSuperAdmin && !branchId ? 'Select a branch to adjust stock; catalog editing is branch-independent' : 'Read-only view')}
            </div>
          </div>
        </div>
      </div>

      {adjustingLine && canAdjustStockForBranch && (
        <StockAdjustPanel
          item={{ ...adjustingLine, label: `${adjustingLine.label}${activeBranchName ? ` — ${activeBranchName}` : ''}` }}
          currentStock={adjustingLine.stock}
          onClose={() => setAdjustingLine(null)}
          onSave={handleSaveAdjustment}
        />
      )}
      {showLog && canViewLogs && (branchId || (isSuperAdmin && !branchId)) && (
        <StockLogDrawer
          branchId={branchId}
          itemType="BOOK"
          itemId={logItemId}
          catalogKey={logCatalogKey}
          classGrade={grade}
          onClose={() => {
            setShowLog(false)
            setLogCatalogKey(null)
            setLogItemId(null)
          }}
        />
      )}
      {showBulkEdit && isSuperAdmin && (
        <BulkEditClassStockModal
          kit={kit}
          branchId={branchId}
          lines={lines}
          onClose={() => setShowBulkEdit(false)}
          onSave={handleBulkSave}
        />
      )}
      {showBranchPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-headline text-lg font-bold text-on-surface">Select Branch First</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Please select a specific branch on the stock page before adjusting stock.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBranchPrompt(false)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {editingProduct && (canEditProducts || canArchiveProducts) && (
        <CreateProductPanel
          classGrade={grade}
          kitClassLabel={classTitle}
          existingItem={editingProduct}
          canEditProductDetails={canEditProducts}
          canArchiveProducts={canArchiveProducts}
          onClose={() => setEditingProduct(null)}
          onSaved={handleProductEditSaved}
        />
      )}
    </div>
  )
}
