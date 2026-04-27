import { useCallback, useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '@/context/useAdminSession'
import { inventoryApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { SCHOOL_CLASSES, classLabelForGrade } from '@/utils/classes'
import ClassGrid from './ClassGrid'
import KitDetails from './KitDetails'
import BulkEditBooksModal from './BulkEditBooksModal'
import CreateProductPanel from './CreateProductPanel'

export default function BooksView() {
  const { branchId: sessionBranchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const activeBranchId = isSuperAdmin ? selectedBranchId : sessionBranchId

  const [selectedClassId, setSelectedClassId] = useState(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchBranches = useCallback(() => (isSuperAdmin ? branchesApi.list() : null), [isSuperAdmin])
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list.filter((b) => b.type !== 'MAIN')
  }, [branchesData])

  const fetchBooks = useCallback(
    () => inventoryApi.listBooks({ branchId: activeBranchId }),
    [activeBranchId],
  )
  const { data: classes, loading } = useApi(fetchBooks, null, [activeBranchId, refreshKey])

  const classList = (classes ?? []).map((c) => ({
    id: c.id,
    label: classLabelForGrade(c.grade),
    grade: Number(c.grade),
    section: c.section,
    bookKit: c.bookKit,
  }))

  const availableGrades = new Set(classList.map((c) => c.grade))
  const uniqueGrades = SCHOOL_CLASSES.map((item) => ({
    ...item,
    id: String(item.grade),
    hasData: availableGrades.has(item.grade),
  }))

  const effectiveSelectedId = selectedClassId ?? (uniqueGrades[0]?.id)
  const selectedGrade = effectiveSelectedId !== undefined && effectiveSelectedId !== null
    ? Number(effectiveSelectedId) : null
  const selectedClassMeta = uniqueGrades.find((item) => item.id === effectiveSelectedId)
  const selectedClassData = selectedGrade !== null && !Number.isNaN(selectedGrade)
    ? classList.find((c) => c.grade === selectedGrade && c.section === 'A') ??
      classList.find((c) => c.grade === selectedGrade)
    : null

  function handleProductSaved() {
    setShowCreateProduct(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <>
      {/* Branch selector + action buttons for Super Admin */}
      {isSuperAdmin && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Branch</label>
          <select
            value={selectedBranchId ?? ''}
            onChange={(e) => { setSelectedBranchId(e.target.value || null); setSelectedClassId(null) }}
            className="rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— Select branch —</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {(activeBranchId || selectedClassMeta) && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateProduct(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-base" aria-hidden>add</span>
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowBulkEdit(true)}
                disabled={!activeBranchId}
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
                Bulk Edit
              </button>
            </div>
          )}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
            Bulk Edit Class Stock
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-sm text-on-surface-variant">Loading inventory…</p>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          <ClassGrid
            classes={uniqueGrades}
            selectedClassId={effectiveSelectedId}
            onSelectClass={setSelectedClassId}
          />
          <KitDetails
            key={`${effectiveSelectedId}-${activeBranchId}-${refreshKey}`}
            selectedClassId={effectiveSelectedId}
            selectedClassLabel={selectedClassMeta?.label}
            classData={selectedClassData}
            branchId={activeBranchId}
            isSuperAdmin={isSuperAdmin}
            onProductSaved={handleProductSaved}
          />
        </div>
      )}

      {showBulkEdit && activeBranchId && (
        <BulkEditBooksModal
          branchId={activeBranchId}
          selectedGrade={selectedGrade}
          selectedClassLabel={selectedClassMeta?.label}
          classList={classList}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {showCreateProduct && isSuperAdmin && (
        <CreateProductPanel
          classGrade={selectedGrade}
          kitClassLabel={selectedClassMeta?.label}
          onClose={() => setShowCreateProduct(false)}
          onSaved={handleProductSaved}
        />
      )}

      {/* FAB — Super Admin only */}
      {isSuperAdmin && (
        <button
          type="button"
          onClick={() => setShowCreateProduct(true)}
          disabled={!selectedClassMeta}
          title="Add Product"
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-110 active:scale-90"
        >
          <span className="material-symbols-outlined text-3xl" aria-hidden>add</span>
        </button>
      )}
    </>
  )
}
