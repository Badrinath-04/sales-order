import { useCallback, useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { usePermission } from '../../../hooks/usePermission'
import { inventoryApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import SizeInventory from './SizeInventory'
import UniformCategory from './UniformCategory'
import BulkEditUniformsModal from './BulkEditUniformsModal'

function buildSizeRows(sizes, branchId) {
  return sizes.map((sz) => {
    const stockEntry = sz.uniformStocks?.find((s) => !branchId || s.branchId === branchId)
    const qty = stockEntry?.quantity ?? 0
    const tone = stockEntry?.tone?.toLowerCase() ?? 'normal'
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

export default function UniformsView() {
  const { role, branchId: sessionBranchId } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const canAdjustStock = usePermission('canAdjustStock')

  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const activeBranchId = isSuperAdmin ? selectedBranchId : sessionBranchId

  const [showBulkEdit, setShowBulkEdit] = useState(false)

  // Fetch branches for Super Admin
  const fetchBranches = useCallback(() => (isSuperAdmin ? branchesApi.list() : null), [isSuperAdmin])
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list.filter((b) => b.type !== 'MAIN')
  }, [branchesData])

  const fetchCategories = useCallback(() => inventoryApi.listUniformCategories(), [])
  const { data: categoriesData, loading: catsLoading } = useApi(fetchCategories, null, [])

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
  const { data: sizesData, loading: sizesLoading } = useApi(fetchUniforms, null, [activeCategoryId, activeBranchId])

  const activeCategory = categories.find((c) => c.selected) ?? categories[0]
  const rows = useMemo(
    () => buildSizeRows(sizesData ?? [], activeBranchId),
    [sizesData, activeBranchId],
  )

  if (catsLoading) return <p className="py-8 text-sm text-on-surface-variant">Loading uniforms…</p>

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Branch selector + Bulk Edit row */}
      <div className="flex flex-wrap items-center gap-4">
        {isSuperAdmin && (
          <>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Branch</label>
            <select
              value={selectedBranchId ?? ''}
              onChange={(e) => setSelectedBranchId(e.target.value || null)}
              className="rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select branch —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </>
        )}
        {isSuperAdmin && (activeBranchId || !isSuperAdmin) && (
          <button
            type="button"
            onClick={() => setShowBulkEdit(true)}
            className="ml-auto flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
            Bulk Edit All Sizes
          </button>
        )}
      </div>

      {isSuperAdmin && !activeBranchId ? (
        <p className="py-8 text-sm text-on-surface-variant">Select a branch above to manage uniform stock.</p>
      ) : (
        <>
          <UniformCategory categories={categories} onSelect={setSelectedCategoryId} />
          <SizeInventory
            key={`${activeCategoryId}-${activeBranchId}`}
            categoryLabel={activeCategory?.label ?? ''}
            rows={rows}
            canManageStock={canAdjustStock}
            loading={sizesLoading}
            branchId={activeBranchId}
          />
        </>
      )}

      {showBulkEdit && (
        <BulkEditUniformsModal
          branchId={activeBranchId}
          categoryId={activeCategoryId}
          categoryLabel={activeCategory?.label ?? ''}
          rows={rows}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      <div className="fixed bottom-8 right-8 z-50">
        <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95">
          <span className="material-symbols-outlined text-3xl" aria-hidden>inventory</span>
        </button>
      </div>
    </div>
  )
}
