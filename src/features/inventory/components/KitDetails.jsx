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
  // Stock history is available to all admin roles.
  const canViewLogs = true
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
  const activePanelTab = editingProduct ? 'edit' : adjustingLine ? 'adjust' : showLog ? 'history' : null

  const panelTargetLine = useMemo(() => {
    if (editingProduct) {
      return lines.find((line) => line.itemId === editingProduct.id) ?? lines[0] ?? null
    }
    if (adjustingLine) return adjustingLine
    if (showLog) {
      if (logItemId) return lines.find((line) => line.itemId === logItemId) ?? lines[0] ?? null
      if (logCatalogKey) {
        return lines.find((line) => line._raw?.catalogKey === logCatalogKey) ?? lines[0] ?? null
      }
    }
    return lines[0] ?? null
  }, [editingProduct, adjustingLine, showLog, logItemId, logCatalogKey, lines])

  const panelTabs = useMemo(
    () => ({
      activeTab: activePanelTab,
      tabs: [
        { id: 'edit', label: 'Edit Product', disabled: !(canEditProducts || canArchiveProducts) || !panelTargetLine?._raw },
        { id: 'adjust', label: 'Adjust Stock', disabled: !canAdjustStockForBranch || !panelTargetLine },
        { id: 'history', label: 'Product History', disabled: !canViewLogs || !(branchId || (isSuperAdmin && !branchId)) },
      ],
    }),
    [
      activePanelTab,
      canEditProducts,
      canArchiveProducts,
      canAdjustStockForBranch,
      canViewLogs,
      panelTargetLine,
      branchId,
      isSuperAdmin,
    ],
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

  function closeAllPanels() {
    setEditingProduct(null)
    setAdjustingLine(null)
    setShowLog(false)
  }

  function handlePanelTabChange(nextTab) {
    const targetLine = panelTargetLine
    if (nextTab === 'edit') {
      if (!(canEditProducts || canArchiveProducts) || !targetLine?._raw) return
      setAdjustingLine(null)
      setShowLog(false)
      setEditingProduct(targetLine._raw)
      return
    }
    if (nextTab === 'adjust') {
      if (!canAdjustStockForBranch || !targetLine) return
      setEditingProduct(null)
      setShowLog(false)
      setAdjustingLine(targetLine)
      return
    }
    if (nextTab === 'history') {
      if (!canViewLogs || !(branchId || (isSuperAdmin && !branchId))) return
      const raw = targetLine?._raw
      setEditingProduct(null)
      setAdjustingLine(null)
      setLogCatalogKey(raw?.catalogKey || null)
      setLogItemId(raw?.catalogKey ? null : targetLine?.itemId ?? null)
      setShowLog(true)
    }
  }

  function openManagePanel(line) {
    closeAllPanels()
    if ((canEditProducts || canArchiveProducts) && line?._raw) {
      setEditingProduct(line._raw)
      return
    }
    if (canAdjustStockForBranch) {
      setAdjustingLine(line)
      return
    }
    if (canViewLogs && (branchId || (isSuperAdmin && !branchId))) {
      setLogCatalogKey(line?._raw?.catalogKey || null)
      setLogItemId(line?._raw?.catalogKey ? null : line?.itemId ?? null)
      setShowLog(true)
    }
  }

  if (!kit && !hasSelectedClass) {
    return (
      <div className="col-span-1 lg:col-span-5">
        <div className="flex h-full items-center justify-center rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant">
          Select a class to view kit details.
        </div>
      </div>
    )
  }

  if (!kit) {
    return (
      <div className="col-span-1 lg:col-span-5">
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
    <div className="col-span-1 lg:col-span-5">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_12px_32px_rgba(27,28,28,0.06)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-5">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">{displayTitle}</h3>
            <p className="text-xs font-medium text-stone-500">{lastUpdated}</p>
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
        <div className="flex flex-1 flex-col space-y-3 overflow-hidden p-5">
          {(canEditProducts || canArchiveProducts || canAdjustStock || canViewLogs) && (
            <p className="text-[11px] font-semibold text-amber-500">
              Use "Manage Product" to access Edit, Adjust Stock, and Product History tabs
            </p>
          )}
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
              <div key={line.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-stone-400" aria-hidden>{line.icon}</span>
                    <span className="text-[13px] font-bold text-stone-700">{line.label}</span>
                  </div>
                  {(canEditProducts || canArchiveProducts || canAdjustStock || canViewLogs) && (
                    <button
                      type="button"
                      onClick={() => openManagePanel(line)}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm hover:bg-primary/15 transition-colors"
                      aria-label={`Manage ${line.label}`}
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden>settings</span>
                      Manage Product
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
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
                        placeholder="—"
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
                      placeholder="—"
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
                      onClick={() => {
                        openManagePanel(line)
                      }}
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

      </div>

      {adjustingLine && canAdjustStockForBranch && (
        <StockAdjustPanel
          item={{ ...adjustingLine, label: `${adjustingLine.label}${activeBranchName ? ` — ${activeBranchName}` : ''}` }}
          currentStock={adjustingLine.stock}
          onClose={() => setAdjustingLine(null)}
          onSave={handleSaveAdjustment}
          panelTabs={{ ...panelTabs, onTabChange: handlePanelTabChange }}
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
          panelTabs={{ ...panelTabs, onTabChange: handlePanelTabChange }}
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
          panelTabs={{ ...panelTabs, onTabChange: handlePanelTabChange }}
        />
      )}
    </div>
  )
}
