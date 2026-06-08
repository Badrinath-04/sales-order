import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { usePermission } from '@/hooks/usePermission'
import { useShellPaths } from '@/hooks/useShellPaths'
import { useApi, useMutation } from '@/hooks/useApi'
import { useToast } from '@/context/ToastContext'
import { admissionsApi, branchesApi } from '@/services/api'
import { ROLES } from '@/config/navigation'
import { isSupportedGrade } from '@/utils/classes'
import AdmissionForm from './components/AdmissionForm'
import AdmissionsTable from './components/AdmissionsTable'
import SummaryBar from './components/SummaryBar'
import AdmissionFilters from './components/AdmissionFilters'

const EMPTY_FILTERS = { search: '', grade: '', section: '', status: '' }

export default function AdmissionsList() {
  const navigate = useNavigate()
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const isAllBranchesAdmin = !isSuperAdmin && !branchId
  const showBranchSelect = isSuperAdmin || isAllBranchesAdmin
  const canManage = usePermission('canManageAdmissions')
  const paths = useShellPaths()
  const toast = useToast()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350)
    return () => clearTimeout(t)
  }, [filters.search])

  const fetchBranches = useCallback(
    () => (showBranchSelect ? branchesApi.list() : null),
    [showBranchSelect],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [showBranchSelect])
  const branches = useMemo(() => {
    if (!branchesData) return []
    return Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
  }, [branchesData])

  const [selectedFormBranchId, setSelectedFormBranchId] = useState(null)
  const formBranchId = showBranchSelect
    ? (selectedFormBranchId ?? branches[0]?.id ?? null)
    : branchId

  const classesBranchId = formBranchId

  const fetchClasses = useCallback(
    () => (classesBranchId ? branchesApi.getClasses(classesBranchId) : null),
    [classesBranchId],
  )
  const { data: classesData } = useApi(fetchClasses, null, [classesBranchId])

  const sectionsByGrade = useMemo(() => {
    const map = {}
    for (const c of classesData ?? []) {
      if (!isSupportedGrade(c.grade)) continue
      const grade = Number(c.grade)
      if (!map[grade]) map[grade] = []
      if (!map[grade].includes(c.section)) map[grade].push(c.section)
    }
    Object.values(map).forEach((arr) => arr.sort())
    return map
  }, [classesData])

  const fetchSettings = useCallback(
    () => admissionsApi.getSettings(classesBranchId ? { params: { branchId: classesBranchId } } : undefined),
    [classesBranchId],
  )
  const { data: settingsData } = useApi(fetchSettings, null, [classesBranchId])

  const queryParams = useMemo(() => {
    const params = {}
    if (!showBranchSelect && branchId) params.branchId = branchId
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.grade !== '') params.grade = filters.grade
    if (filters.section) params.section = filters.section
    if (filters.status) params.status = filters.status
    params.limit = 50
    return params
  }, [showBranchSelect, branchId, debouncedSearch, filters.grade, filters.section, filters.status])

  const fetchList = useCallback(() => admissionsApi.list(queryParams), [queryParams])
  const { data: listData, loading: listLoading, refetch } = useApi(fetchList, null, [queryParams])

  const admissions = listData?.admissions ?? []
  const summary = listData?.summary ?? { totalStudents: 0, totalCollected: 0, pendingCount: 0 }

  const { mutate: createAdmission, loading: creating } = useMutation(admissionsApi.create)

  async function handleCreate(payload) {
    try {
      const row = await createAdmission(payload)
      toast.success('Admission saved as Pending — proceed to collect payment.')
      setShowForm(false)
      setFilters(EMPTY_FILTERS)
      navigate(paths.admissionsPayment, {
        state: {
          admissionId: row.id,
          admission: row,
        },
      })
    } catch (err) {
      toast.error(err.message || 'Failed to save admission record')
    }
  }

  function handleRowClick(admission) {
    navigate(paths.admissionsPayment, {
      state: {
        admissionId: admission.id,
        admission,
      },
    })
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-on-surface">New Admissions</h1>
        <p className="text-sm text-on-surface-variant">
          Register prospective students and collect the admission fee — fully separate from Books &amp; Uniform orders.
        </p>
      </div>

      <SummaryBar
        totalStudents={summary.totalStudents}
        totalCollected={summary.totalCollected}
        pendingCount={summary.pendingCount}
      />

      {canManage && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2 text-base font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">person_add</span>
              New Admission
            </span>
            <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: showForm ? 'rotate(180deg)' : 'none' }}>
              expand_more
            </span>
          </button>
          {showForm && (
            <div className="mt-5 border-t border-outline-variant/20 pt-5">
              <AdmissionForm
                branches={branches}
                showBranchSelect={showBranchSelect}
                branchId={formBranchId}
                onBranchChange={setSelectedFormBranchId}
                defaultAmount={settingsData?.defaultAmount}
                sectionsByGrade={sectionsByGrade}
                submitting={creating}
                onSubmit={handleCreate}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-on-surface">Admission Records</h2>
          <button
            type="button"
            onClick={() => navigate(paths.admissionsTransactions)}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary sm:self-auto"
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            Transaction History
          </button>
        </div>
        <AdmissionFilters filters={filters} sectionsByGrade={sectionsByGrade} onChange={setFilters} />
        <AdmissionsTable admissions={admissions} loading={listLoading} onRowClick={handleRowClick} />
      </div>
      {!listLoading && admissions.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={refetch}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}
