import { useCallback, useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { usePermission } from '../../../hooks/usePermission'
import { inventoryApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import SizeInventory from './SizeInventory'
import UniformCategory from './UniformCategory'
import BulkEditUniformsModal from './BulkEditUniformsModal'
import CreateUniformProductPanel from './CreateUniformProductPanel'

function buildSizeRows(sizes, branchId) {
  return sizes.map((sz) => {
    const stocks = sz.uniformStocks ?? []
    const qty = branchId
      ? Number(stocks.find((s) => s.branchId === branchId)?.quantity ?? 0)
      : stocks.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0)
    const stockEntry = branchId ? stocks.find((s) => s.branchId === branchId) : null
    const tone = branchId
      ? (stockEntry?.tone?.toLowerCase() ?? 'normal')
      : (qty <= 10 ? 'critical' : qty <= 50 ? 'low' : 'normal')
    return {
      id: sz.id,
      sizeId: sz.id,
      code: sz.code,
      name: sz.name,
      stock: qty,
      stockLabel: `${qty.toLocaleString('en-US')} Units`,
      priceLabel: `₹${Number(sz.price).toFixed(2)}`,
      price: Number(sz.price),
      tone,
      alertLabel: tone === 'low' ? 'Low Stock Alert' : tone === 'critical' ? 'Critical Stock' : undefined,
    }
  })
}

export default function UniformsView({ branchId: activeBranchId, onBranchIdChange }) {
  const { role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const canAdjustStock = usePermission('canAdjustStock')
  const canBulkEditStock = usePermission('canBulkEditStock')
  const canCreateProducts = usePermission('canCreateProducts')
  const canViewLogs = usePermission('canViewStockLogs')

  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch branches for Super Admin
  const fetchBranches = useCallback(() => (isSuperAdmin ? branchesApi.list() : null), [isSuperAdmin])
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list.filter((b) => b.type !== 'MAIN')
  }, [branchesData])

  const fetchCategories = useCallback(() => inventoryApi.listUniformCategories(), [])
  const { data: categoriesData, loading: catsLoading } = useApi(fetchCategories, null, [refreshKey])

  const rawCategories = categoriesData ?? []
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  const categories = rawCategories.map((c, i) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    selected: selectedCategoryId ? c.id === selectedCategoryId : i === 0,
  }))

  const activeCategoryId = selectedCategoryId ?? rawCategories[0]?.id

  const fetchUniforms = useCallback(
    () => inventoryApi.listUniforms({ categoryId: activeCategoryId, branchId: activeBranchId }),
    [activeCategoryId, activeBranchId],
  )
  const { data: sizesData, loading: sizesLoading } = useApi(fetchUniforms, null, [activeCategoryId, activeBranchId, refreshKey])

  const activeCategory = categories.find((c) => c.selected) ?? categories[0]
  const activeCategoryRaw = rawCategories.find((c) => c.id === activeCategory?.id) ?? rawCategories[0]
  const rows = useMemo(
    () => buildSizeRows(sizesData ?? [], activeBranchId),
    [sizesData, activeBranchId],
  )

  function handleProductSaved() {
    setShowCreateProduct(false)
    setEditingCategory(null)
    setRefreshKey((k) => k + 1)
  }

  if (catsLoading) return <p className="py-8 text-sm text-on-surface-variant">Loading uniforms…</p>

  return (
    <>
      {isSuperAdmin && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Branch</label>
          <select
            value={activeBranchId ?? ''}
            onChange={(e) => onBranchIdChange?.(e.target.value || null)}
            className="rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {(activeBranchId || activeCategoryId) && (
            <div className="ml-auto flex items-center gap-2">
              {canCreateProducts && (
                <button
                  type="button"
                  onClick={() => { setEditingCategory(null); setShowCreateProduct(true) }}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>add</span>
                  Add Product
                </button>
              )}
              {canBulkEditStock && activeBranchId && activeCategoryId && (
                <button
                  type="button"
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
                  Bulk Edit
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isSuperAdmin && canBulkEditStock && activeBranchId && activeCategoryId && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
            Bulk Edit Uniform Stock
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5">
          <UniformCategory categories={categories} onSelect={setSelectedCategoryId} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <SizeInventory
            key={`${activeCategoryId}-${activeBranchId ?? 'all'}`}
            categoryLabel={activeCategory?.label ?? ''}
            categoryIcon={activeCategory?.icon}
            rows={rows}
            canManageStock={canAdjustStock && Boolean(activeBranchId)}
            canBulkEditStock={canBulkEditStock}
            canCreateProducts={canCreateProducts}
            canViewLogs={canViewLogs}
            loading={sizesLoading}
            branchId={activeBranchId}
            onOpenBulkEdit={() => setShowBulkEdit(true)}
            onOpenEditProduct={() => {
              setEditingCategory({ ...activeCategoryRaw, sizes: sizesData ?? [] })
              setShowCreateProduct(true)
            }}
          />
        </div>
      </div>

      {showBulkEdit && (
        <BulkEditUniformsModal
          branchId={activeBranchId}
          categoryLabel={activeCategory?.label ?? ''}
          rows={rows}
          onClose={() => setShowBulkEdit(false)}
          onSave={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {showCreateProduct && canCreateProducts && (
        <CreateUniformProductPanel
          existingCategory={editingCategory}
          onClose={() => { setShowCreateProduct(false); setEditingCategory(null) }}
          onSaved={handleProductSaved}
        />
      )}

      <div className="fixed bottom-8 right-8 z-50">
        <button
          type="button"
          onClick={() => { setEditingCategory(null); setShowCreateProduct(true) }}
          disabled={!canCreateProducts}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-3xl" aria-hidden>add</span>
        </button>
      </div>
    </>
  )
}
