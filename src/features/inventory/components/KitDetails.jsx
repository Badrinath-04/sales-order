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

function buildLinesFromKit(kit, branchId) {
  if (!kit?.items?.length) return []
  return kit.items.map((item) => {
    const stockEntry = item.bookStocks?.find((s) => !branchId || s.branchId === branchId)
    return {
      id: item.id,
      itemId: item.id,
      label: item.label,
      icon: item.icon ?? 'menu_book',
      stock: stockEntry?.quantity ?? 0,
      openingPending: !stockEntry,
      price: Number(item.price),
      // Pass full item data for edit panel
      _raw: item,
    }
  })
}

export default function KitDetails({ selectedClassId, selectedClassLabel, classData, branchId, isSuperAdmin: isSuperAdminProp, onProductSaved }) {
  const { role } = useAdminSession()
  const isSuperAdmin = isSuperAdminProp ?? role === ROLES.SUPER_ADMIN
  const canAdjustStock = usePermission('canAdjustStock')
  const canViewLogs = usePermission('canViewStockLogs')
  const canAdjustStockForBranch = canAdjustStock && Boolean(branchId)

  const [adjustingLine, setAdjustingLine] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [stockOverrides, setStockOverrides] = useState({})

  const kit = classData?.bookKit
  const grade = selectedClassId !== undefined && selectedClassId !== null
    ? Number(selectedClassId) : null
  const hasSelectedClass = grade !== null && !Number.isNaN(grade)
  const classTitle = selectedClassLabel ?? (hasSelectedClass ? `Class ${grade}` : 'Class')

  const displayTitle = hasSelectedClass ? `${classTitle} Kit Details` : 'Kit Details'
  const badge = kit?.badge ?? (hasSelectedClass ? 'Academic Kit' : '')
  const lastUpdated = kit?.lastUpdated
    ? `Last updated: ${new Date(kit.lastUpdated).toLocaleDateString('en-GB').replace(/\//g, '/')}`
    : ''

  const baseLines = useMemo(() => buildLinesFromKit(kit, branchId), [kit, branchId])
  const lines = useMemo(
    () => baseLines.map((line) => ({
      ...line,
      stock: stockOverrides[line.itemId] ?? line.stock,
    })),
    [baseLines, stockOverrides],
  )

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
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowBulkEdit(true)}
                className="flex items-center gap-1.5 rounded-lg border border-outline-variant/20 bg-white px-3 py-1.5 text-xs font-semibold text-on-surface-variant shadow-sm hover:bg-primary hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden>edit_note</span>
                Bulk Edit
              </button>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-8">
          {lines.length === 0 && (
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

          {lines.map((line) => {
            const isLow = line.stock < 20
            return (
              <div key={line.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-stone-400" aria-hidden>{line.icon}</span>
                    <span className="text-sm font-bold text-stone-700">{line.label}</span>
                    {/* Gear icon for Super Admin — edit product definition */}
                    {isSuperAdmin && (
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
                  </div>
                  {canAdjustStockForBranch && (
                    <button
                      type="button"
                      onClick={() => setAdjustingLine(line)}
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
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 bg-stone-50 p-8">
          <div className="flex w-full gap-3">
            {canViewLogs && branchId && (
              <button
                type="button"
                onClick={() => setShowLog(true)}
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
          item={adjustingLine}
          currentStock={adjustingLine.stock}
          onClose={() => setAdjustingLine(null)}
          onSave={handleSaveAdjustment}
        />
      )}
      {showLog && canViewLogs && branchId && (
        <StockLogDrawer
          branchId={branchId}
          itemType="BOOK"
          onClose={() => setShowLog(false)}
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
      {editingProduct && isSuperAdmin && (
        <CreateProductPanel
          classGrade={grade}
          kitClassLabel={classTitle}
          existingItem={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleProductEditSaved}
        />
      )}
    </div>
  )
}
