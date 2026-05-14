import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '@/context/useAdminSession'
import { branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { usePermission } from '@/hooks/usePermission'
import { useShellPaths } from '@/hooks/useShellPaths'
import { ROLES } from '@/config/navigation'
import { SCHOOL_CLASSES, classLabelForGrade, isSupportedGrade, shortClassLabelForGrade } from '@/utils/classes'
import Breadcrumb from './components/Breadcrumb'
import ClassGrid from './components/ClassGrid'
import QuickEnroll from './components/QuickEnroll'
import SectionSelector from './components/SectionSelector'
import StudentDistribution from './components/StudentDistribution'
import AddStudentModal from './components/AddStudentModal'
import { useSidebar } from '@/context/SidebarContext'
import './styles.scss'

const AVATAR_TONES = ['primary', 'secondary', 'tertiary']

function mapStudent(s, idx) {
    const latest = s.orders?.[0]
    const latestOrderNotes = latest?.notes?.trim() ? latest.notes.trim() : null
    const books =
    latest ? (
      latest.bookStatus === 'TAKEN' ? 'Taken' :
      latest.bookStatus === 'PARTIAL' ? 'Partial' : 'Not Taken'
    ) : 'Not Taken'

  return {
    id: s.id,
    name: s.name,
    roll: s.rollNumber,
    initials: s.initials,
    guardian: s.guardianName ?? 'N/A',
    parentPhone: s.guardianPhone ?? '',
    books,
    uniform: latest ? (
      latest.uniformStatus === 'COMPLETE' ? 'Complete' : 'Pending'
    ) : 'Pending',
    payment: latest ? (
      latest.paymentStatus === 'PAID' ? 'Paid' :
      latest.paymentStatus === 'PARTIAL' ? 'Partial' : 'Unpaid'
    ) : 'Unpaid',
    latestOrderId: s.latestOrderId ?? null,
    latestOrderInternalId: s.latestOrderInternalId ?? null,
    dueAmount: Number(s.dueAmount ?? 0),
    totalAmount: Number(s.totalAmount ?? 0),
    paidAmount: Number(s.paidAmount ?? 0),
    latestOrderNotes,
    avatarTone: AVATAR_TONES[idx % AVATAR_TONES.length],
  }
}

export default function NewOrderSelection() {
  const navigate = useNavigate()
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const canViewTransactions = usePermission('canViewTransactions')
  const paths = useShellPaths()
  const { toggle: toggleSidebar } = useSidebar()

  const [selectedBranchId, setSelectedBranchId] = useState(isSuperAdmin ? null : branchId)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const studentSectionRef = useRef(null)

  const fetchBranches = useCallback(
    () => (isSuperAdmin ? branchesApi.list() : null),
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = useMemo(() => {
    if (!branchesData) return []
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list
  }, [branchesData])

  const activeBranchId = isSuperAdmin ? selectedBranchId : branchId

  const fetchClasses = useCallback(
    () => (activeBranchId ? branchesApi.getClasses(activeBranchId) : null),
    [activeBranchId],
  )
  const { data: classesData, loading: classesLoading } = useApi(fetchClasses, null, [activeBranchId])

  const allClasses = useMemo(
    () => (classesData ?? []).filter((c) => isSupportedGrade(c.grade)),
    [classesData],
  )

  const uniqueGrades = useMemo(() => {
    const studentCountsByGrade = new Map()
    for (const c of allClasses) {
      const grade = Number(c.grade)
      studentCountsByGrade.set(
        grade,
        (studentCountsByGrade.get(grade) ?? 0) + (c.studentCount ?? (c._count?.students ?? 0)),
      )
    }

    return SCHOOL_CLASSES.map((item) => ({
      id: item.grade,
      name: classLabelForGrade(item.grade),
      shortLabel: shortClassLabelForGrade(item.grade),
      students: studentCountsByGrade.get(item.grade) ?? 0,
    }))
  }, [allClasses])

  const sectionsForGrade = useMemo(() => {
    if (!selectedClass) return []
    return allClasses
      .filter((c) => c.grade === selectedClass.id)
      .map((c) => ({
        id: c.id,
        name: `Section ${c.section}`,
        students: c.studentCount ?? (c._count?.students ?? 0),
        section: c.section,
      }))
  }, [allClasses, selectedClass])

  const fetchStudents = useCallback(() => {
    if (!activeBranchId || !selectedSection?.id) return null
    return branchesApi.getStudents(activeBranchId, selectedSection.id)
  }, [activeBranchId, selectedSection])

  const { data: studentsData, loading: studentsLoading, refetch: refetchStudents } = useApi(
    fetchStudents,
    null,
    [activeBranchId, selectedSection?.id],
  )

  const mappedStudents = useMemo(
    () => (studentsData ?? []).map((s, i) => mapStudent(s, i)),
    [studentsData],
  )

  const handleProceedToConfigure = () => {
    if (!selectedClass || !selectedSection) return
    const records = mappedStudents.filter((s) => selectedStudents.includes(s.id))
    navigate(paths.ordersConfigure, {
      state: {
        selectedStudents: records,
        selectedClass,
        selectedSection,
        classId: selectedSection.id,
        branchId: activeBranchId,
      },
    })
  }

  const handleViewPurchase = (studentRecord) => {
    if (!studentRecord?.latestOrderId) return
    navigate(paths.transactionDetail(encodeURIComponent(studentRecord.latestOrderId)), {
      state: {
        reorderState: {
          selectedStudents: [studentRecord],
          selectedClass,
          selectedSection,
          classId: selectedSection?.id,
          branchId: activeBranchId,
        },
      },
    })
  }

  const handleClearDue = (studentRecord) => {
    if (!studentRecord?.latestOrderInternalId || Number(studentRecord?.dueAmount ?? 0) <= 0) return
    navigate(paths.ordersPayment, {
      state: {
        selectedStudents: [studentRecord],
        selectedClass,
        selectedSection,
        classId: selectedSection?.id,
        branchId: activeBranchId,
        existingOrderId: studentRecord.latestOrderInternalId,
        existingOrderNumber: studentRecord.latestOrderId,
        dueAmount: studentRecord.dueAmount,
        totalAmount: studentRecord.totalAmount,
        paidAmount: studentRecord.paidAmount,
      },
    })
  }

  useEffect(() => {
    if (selectedSection && studentSectionRef.current) {
      studentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedSection])

  useEffect(() => {
    const onOrderConfirmed = () => {
      if (selectedSection?.id) refetchStudents()
    }
    window.addEventListener('skm-order-confirmed', onOrderConfirmed)
    return () => window.removeEventListener('skm-order-confirmed', onOrderConfirmed)
  }, [selectedSection?.id, refetchStudents])

  const handleSelectBranch = (e) => {
    setSelectedBranchId(e.target.value || null)
    setSelectedClass(null)
    setSelectedSection(null)
    setSelectedStudents([])
  }

  const handleSelectClass = (item) => {
    setSelectedClass(item)
    setSelectedSection(null)
    setSelectedStudents([])
  }

  const handleSelectSection = (section) => {
    setSelectedSection(section)
    setSelectedStudents([])
  }

  const handleBreadcrumbNavigate = (segment) => {
    if (segment === 'new-selection' || segment === 'orders') {
      setSelectedClass(null)
      setSelectedSection(null)
      setSelectedStudents([])
    }
  }

  return (
    <div className="new-order-screen min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex w-full items-center gap-3 bg-white/80 px-4 md:px-6 py-2 shadow-sm backdrop-blur-xl dark:bg-neutral-900/80">
        {/* Hamburger for mobile/tablet */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 rounded-xl p-2 hover:bg-neutral-100"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-neutral-700" aria-hidden>menu</span>
        </button>
        <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text font-headline text-base md:text-xl font-bold tracking-tight text-transparent shrink-0">
          SchoolKit Pro
        </span>
        <div className="relative flex-1 max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-neutral-400" aria-hidden>
            search
          </span>
          <input
            className="w-full rounded-xl border-none bg-neutral-100/50 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20 dark:bg-neutral-800/50"
            placeholder="Search students, kits, or orders..."
            type="search"
            name="global-order-search"
            autoComplete="off"
          />
        </div>
      </header>
      <div className={`w-full px-4 md:px-6 py-5 ${selectedSection ? 'pb-32' : ''}`}>
        <Breadcrumb
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          onNavigate={handleBreadcrumbNavigate}
        />
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="mb-1 font-headline text-2xl md:text-[2rem] font-extrabold tracking-tight text-on-surface">
              New Order Selection
            </h1>
            <p className="font-body text-sm text-on-surface-variant">
              Choose a class to begin the enrollment kit distribution
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {isSuperAdmin && (
              <div className="w-full md:w-64">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary" htmlFor="branch-select">
                  Select Branch
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-primary" aria-hidden>
                    location_city
                  </span>
                  <select
                    id="branch-select"
                    value={selectedBranchId ?? ''}
                    onChange={handleSelectBranch}
                    className="w-full appearance-none rounded-xl border-2 border-primary/10 bg-white py-3 pl-10 pr-8 text-sm shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">— Choose branch —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary" aria-hidden>
                    expand_more
                  </span>
                </div>
              </div>
            )}
            <QuickEnroll />
          </div>
        </div>
        {classesLoading ? (
          <p className="py-8 text-sm text-on-surface-variant">Loading classes…</p>
        ) : activeBranchId ? (
          <ClassGrid classes={uniqueGrades} selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        ) : isSuperAdmin ? (
          <p className="py-8 text-sm text-on-surface-variant">Select a branch above to view classes.</p>
        ) : null}
        {selectedClass ? (
          <SectionSelector
            key={selectedClass.id}
            selectedClassName={selectedClass.name}
            sections={sectionsForGrade}
            selectedSection={selectedSection}
            onSelectSection={handleSelectSection}
          />
        ) : null}
        {selectedClass && selectedSection ? (
          <div ref={studentSectionRef} className="scroll-mt-24 md:scroll-mt-14">
            <StudentDistribution
              key={`${selectedClass.id}-${selectedSection.id}`}
              selectedClass={selectedClass}
              selectedSection={selectedSection}
              selectedStudentIds={selectedStudents}
              onSelectedStudentIdsChange={setSelectedStudents}
              onProceedToConfigure={handleProceedToConfigure}
              students={mappedStudents}
              studentsLoading={studentsLoading}
              onViewPurchase={canViewTransactions ? handleViewPurchase : undefined}
              onClearDue={handleClearDue}
              onOpenAddStudent={() => setShowAddStudent(true)}
            />
          </div>
        ) : null}
        {showAddStudent && selectedSection && (
          <AddStudentModal
            branchId={activeBranchId}
            classId={selectedSection.id}
            className={`${selectedClass.name} — ${selectedSection.name}`}
            onClose={() => setShowAddStudent(false)}
            onAdded={() => refetchStudents()}
          />
        )}
      </div>
    </div>
  )
}
