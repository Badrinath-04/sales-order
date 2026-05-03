import { useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { usePermission } from '../../../hooks/usePermission'
import { inventoryApi } from '@/services/api'
import StockAdjustPanel from './StockAdjustPanel'
import StockLogDrawer from './StockLogDrawer'
import BulkEditClassStockModal from './BulkEditClassStockModal'
import CreateProductPanel from './CreateProductPanel'


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
      <div className="col-span-1 w-full min-w-0 lg:col-span-5">
        <div className="flex h-full items-center justify-center rounded-xl bg-surface-container-lowest p-8 text-on-surface-variant">
          Select a class to view kit details.
        </div>
      </div>
    )
  }

  if (!kit) {
    return (
      <div className="col-span-1 w-full min-w-0 lg:col-span-5">
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
    <div className="col-span-1 w-full min-w-0 lg:col-span-5">
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_12px_32px_rgba(27,28,28,0.06)]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-stone-50/80 p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:p-6">
          <div className="min-w-0 flex-1">
            <h3 className="font-headline text-base font-bold leading-snug text-slate-900 lg:text-xl lg:tracking-tight">{displayTitle}</h3>
            <p className="mt-1 text-xs font-medium text-stone-500">{lastUpdated}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            {badge && (
              <div className="rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-bold uppercase leading-tight text-blue-900 ring-1 ring-blue-200/80 sm:text-xs">
                {badge}
              </div>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-3 overflow-x-hidden overflow-y-auto p-4 sm:p-5">
          {(canEditProducts || canArchiveProducts || canAdjustStock || canViewLogs) && (
            <p className="text-[11px] font-semibold leading-relaxed text-amber-500">
              Use &quot;Manage Product&quot; to access Edit, Adjust Stock, and Product History tabs
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
              <div
                key={line.id}
                className="w-full min-w-0 rounded-xl border border-stone-200/60 bg-stone-100/50 p-3 sm:p-4 lg:rounded-2xl lg:border-stone-200/70 lg:bg-stone-100/40 lg:p-5"
              >
                {/* Row 1: icon + label + manage (ref: dark title, light blue bordered button) */}
                <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2 lg:mb-5 lg:flex-nowrap lg:items-center">
                  <span className="material-symbols-outlined shrink-0 text-lg text-slate-500" aria-hidden>{line.icon}</span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900 lg:truncate">{line.label}</span>
                  {(canEditProducts || canArchiveProducts || canAdjustStock || canViewLogs) && (
                    <button
                      type="button"
                      onClick={() => openManagePanel(line)}
                      className="ml-auto flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border border-blue-700/25 bg-sky-50 px-3 py-2 text-xs font-bold text-blue-900 shadow-sm transition-colors hover:bg-sky-100/90 lg:ml-0 lg:px-4 lg:py-2.5 lg:text-sm"
                      aria-label={`Manage ${line.label}`}
                    >
                      <span className="material-symbols-outlined text-base text-blue-800" aria-hidden>settings</span>
                      <span className="lg:hidden">Manage</span>
                      <span className="hidden lg:inline">Manage Product</span>
                    </button>
                  )}
                </div>

                {/* Mobile / tablet: compact two-column row */}
                <div className="grid w-full grid-cols-2 gap-3 lg:hidden">
                  <div className="min-w-0">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Stock</span>
                    <span className={`inline-block rounded-md px-2 py-1 text-sm font-extrabold tabular-nums ${isLow ? 'bg-error/10 text-error' : 'bg-white text-on-surface'}`}>
                      {line.stock}
                      {isLow && <span className="ml-1 text-[9px] font-bold uppercase">{line.openingPending ? '(Pending)' : '(Low)'}</span>}
                    </span>
                  </div>
                  <div className="min-w-0 text-right sm:text-left">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Price</span>
                    <span className="inline-block max-w-full rounded-md bg-white px-2 py-1 text-sm font-extrabold tabular-nums text-on-surface">₹{line.price}</span>
                  </div>
                </div>

                {/* Desktop (ref image 2): equal half-width white cards, uppercase labels above */}
                <div className="hidden w-full grid-cols-2 gap-4 lg:grid lg:gap-5">
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 lg:text-left">
                      Current stock
                    </span>
                    <div
                      className={`flex min-h-[5.25rem] w-full flex-col items-center justify-center rounded-2xl border border-stone-200/70 bg-white px-4 py-4 text-center shadow-[0_4px_18px_rgba(27,28,28,0.1)] ${
                        isLow ? 'ring-2 ring-error/20' : ''
                      }`}
                    >
                      <span className={`text-xl font-extrabold tabular-nums tracking-tight ${isLow ? 'text-error' : 'text-slate-900'}`}>
                        {line.stock}
                      </span>
                      {isLow && (
                        <span className="mt-1 text-[9px] font-bold uppercase text-error">
                          {line.openingPending ? 'Pending' : 'Low'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 lg:text-left">
                      Unit price (₹)
                    </span>
                    <div className="flex min-h-[5.25rem] w-full flex-col items-center justify-center rounded-2xl border border-stone-200/70 bg-white px-4 py-4 text-center shadow-[0_4px_18px_rgba(27,28,28,0.1)]">
                      <span className="text-xl font-extrabold tabular-nums tracking-tight text-slate-900">₹{line.price}</span>
                    </div>
                  </div>
                </div>
                {/* Branch breakdown (super admin only) — ref: light grey rounded panel */}
                {isSuperAdmin && !branchId && (
                  <div className="mt-4 rounded-xl border border-stone-200/50 bg-stone-100/80 p-3 lg:mt-5 lg:rounded-2xl lg:p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">Branch-wise stock</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-stone-600">
                      {line.branchStocks.map((b) => (
                        <span key={`${line.itemId}-${b.branchId}`} className="inline-flex min-w-0 items-baseline gap-1.5">
                          <span className="text-stone-600">{b.branchName}</span>
                          <span className="font-bold text-slate-900 tabular-nums">{b.quantity}</span>
                        </span>
                      ))}
                    </div>
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
