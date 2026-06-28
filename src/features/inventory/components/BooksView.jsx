import { useCallback, useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '@/context/useAdminSession'
import { usePermission } from '@/hooks/usePermission'
import { inventoryApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { SCHOOL_CLASSES, classLabelForGrade } from '@/utils/classes'
import { mergeAllBranchesBookKitsForGrade } from '../utils/mergeAllBranchesBookKitsForGrade'
import { pickClassRowForGrade } from '../utils/pickClassRowForGrade'
import ClassGrid from './ClassGrid'
import KitDetails from './KitDetails'
import BulkEditBooksModal from './BulkEditBooksModal'
import CreateProductPanel from './CreateProductPanel'

export default function BooksView({ branchId: activeBranchId, onBranchIdChange }) {
  const { role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const canSwitchBranches = Boolean(onBranchIdChange)
  const canBulkEditStock = usePermission('canBulkEditStock')
  const canCreateProducts = usePermission('canCreateProducts')

  const [selectedClassId, setSelectedClassId] = useState(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchBranches = useCallback(() => (canSwitchBranches ? branchesApi.list() : null), [canSwitchBranches])
  const { data: branchesData, error: branchesError } = useApi(fetchBranches, null, [canSwitchBranches])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list
  }, [branchesData])

  const mapApiClasses = useCallback(
    (raw) => (raw ?? []).map((c) => ({
      id: c.id,
      label: classLabelForGrade(c.grade),
      grade: Number(c.grade),
      section: c.section,
      bookKit: c.bookKit,
      notebookBookKit: c.notebookBookKit,
    })),
    [],
  )

  const fetchBooks = useCallback(async () => {
    if (activeBranchId) {
      return inventoryApi.listBooks({ branchId: activeBranchId })
    }
    if (!canSwitchBranches) {
      return inventoryApi.listBooks({})
    }
    if (branches.length === 0) {
      return null
    }
    const snapshots = await Promise.all(
      branches.map(async (b) => {
        const res = await inventoryApi.listBooks({ branchId: b.id })
        const body = res?.data
        const payload =
          body && typeof body === 'object' && 'data' in body ? body.data : body
        return {
          branchId: b.id,
          classList: mapApiClasses(Array.isArray(payload) ? payload : []),
        }
      }),
    )
    const primary = snapshots[0]?.classList ?? []
    return {
      status: 200,
      data: {
        data: primary,
        meta: { branchSnapshots: snapshots },
      },
    }
  }, [activeBranchId, branches, canSwitchBranches, mapApiClasses])

  const { data: classes, meta, loading, error: booksError, refetch: refetchBooks } = useApi(
    fetchBooks,
    null,
    [activeBranchId, refreshKey, branches.length, canSwitchBranches],
  )
  const branchSnapshots = meta?.branchSnapshots ?? null

  const classList = (classes ?? []).map((c) => ({
    id: c.id,
    label: classLabelForGrade(c.grade),
    grade: Number(c.grade),
    section: c.section,
    bookKit: c.bookKit,
    notebookBookKit: c.notebookBookKit,
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
  const selectedClassDataRaw =
    selectedGrade !== null && !Number.isNaN(selectedGrade)
      ? pickClassRowForGrade(classList, selectedGrade)
      : null

  const selectedClassData = useMemo(() => {
    if (activeBranchId) return selectedClassDataRaw
    if (branchSnapshots?.length && selectedGrade !== null && !Number.isNaN(selectedGrade)) {
      return mergeAllBranchesBookKitsForGrade(branchSnapshots, selectedGrade, branches)
    }
    return selectedClassDataRaw
  }, [
    selectedClassDataRaw,
    activeBranchId,
    selectedGrade,
    branchSnapshots,
    branches,
  ])

  function handleProductSaved() {
    setShowCreateProduct(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <>
      {canSwitchBranches && (
        <div className="mb-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label className="shrink-0 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Branch</label>
            <select
              value={activeBranchId ?? ''}
              onChange={(e) => {
                onBranchIdChange?.(e.target.value || null)
                setSelectedClassId(null)
              }}
              disabled={Boolean(branchesError)}
              className="w-full min-w-0 rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[12rem]"
            >
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {branchesError && (
              <p className="text-xs font-medium text-error">Could not load branches: {branchesError}</p>
            )}
          </div>
          {(activeBranchId || selectedClassMeta) && (
            <div className="flex w-full min-w-0 flex-wrap items-stretch gap-2 sm:ml-auto sm:w-auto sm:justify-end">
              {(isSuperAdmin || canCreateProducts) && (
                <button
                  type="button"
                  onClick={() => setShowCreateProduct(true)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow hover:bg-primary/90 transition-colors sm:flex-initial"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>add</span>
                  Add Product
                </button>
              )}
              {(isSuperAdmin || canBulkEditStock) && (
                <button
                  type="button"
                  onClick={() => setShowBulkEdit(true)}
                  disabled={!activeBranchId}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:flex-initial"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
                  Bulk Edit
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isSuperAdmin && canBulkEditStock && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>table_edit</span>
            Bulk Edit Class Stock
          </button>
        </div>
      )}

      {booksError && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-on-surface">
          <p className="font-semibold text-error">{booksError}</p>
          <button
            type="button"
            onClick={() => refetchBooks()}
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}

      {loading || (isSuperAdmin && !activeBranchId && branches.length > 0 && !branchSnapshots) ? (
        <p className="py-8 text-sm text-on-surface-variant">Loading inventory…</p>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-12">
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
            branches={branches}
            isSuperAdmin={isSuperAdmin}
            onProductSaved={handleProductSaved}
          />
        </div>
      )}

      {showBulkEdit && (
        <BulkEditBooksModal
          branchId={activeBranchId}
          branches={branches}
          selectedGrade={selectedGrade}
          selectedClassLabel={selectedClassMeta?.label}
          classList={classList}
          kitOverride={
            !activeBranchId && selectedClassData
              ? {
                  items: [
                    ...(selectedClassData.bookKit?.items ?? []),
                    ...(selectedClassData.notebookBookKit?.items ?? []),
                  ],
                }
              : null
          }
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {showCreateProduct && (isSuperAdmin || canCreateProducts) && (
        <CreateProductPanel
          classGrade={selectedGrade}
          kitClassLabel={selectedClassMeta?.label}
          onClose={() => setShowCreateProduct(false)}
          onSaved={handleProductSaved}
        />
      )}

    </>
  )
}
