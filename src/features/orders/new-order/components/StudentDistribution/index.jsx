import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import FilterBar from './FilterBar'
import HeaderStats from './HeaderStats'
import ProceedButton from './ProceedButton'
import StudentTable from './StudentTable'

function matchesPaymentFilter(student, filterId) {
  if (filterId === 'all') return true
  const p = student.payment.toLowerCase()
  if (filterId === 'paid') return p === 'paid'
  if (filterId === 'unpaid') return p === 'unpaid'
  if (filterId === 'partial') return p === 'partial'
  return true
}

export default function StudentDistribution({
  selectedClass,
  selectedSection,
  selectedStudentIds,
  onSelectedStudentIdsChange,
  onProceedToConfigure,
  students: allStudents = [],
  studentsLoading = false,
  onViewPurchase,
  onClearDue,
  onOpenAddStudent,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const contextTitle = `${selectedClass.name} - ${selectedSection.name}`

  const rosterStats = {
    totalStudents: allStudents.length,
    unpaidCount: allStudents.filter((s) => s.payment === 'Unpaid').length,
    kitsDistributedPercent: allStudents.length > 0
      ? Math.round((allStudents.filter((s) => s.books === 'Taken').length / allStudents.length) * 100)
      : 0,
    pendingPayments: allStudents.filter((s) => s.payment !== 'Paid').length,
  }

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allStudents.filter((s) => {
      if (!matchesPaymentFilter(s, activeFilter)) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.guardian.toLowerCase().includes(q)
      )
    })
  }, [allStudents, searchQuery, activeFilter])

  const selectedStudentRecords = useMemo(
    () => allStudents.filter((s) => selectedStudentIds.includes(s.id)),
    [allStudents, selectedStudentIds],
  )

  const toggleStudent = (id) => {
    onSelectedStudentIdsChange((prev) =>
      prev.includes(id) ? [] : [id],
    )
  }

  const toggleAll = (pageIds) => {
    const allPageSelected = pageIds.every((id) => selectedStudentIds.includes(id))
    if (allPageSelected) {
      onSelectedStudentIdsChange((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      onSelectedStudentIdsChange((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  return (
    <div className="student-distribution-reveal pb-24">
      <HeaderStats contextTitle={contextTitle} roster={rosterStats} onOpenAddStudent={onOpenAddStudent} />
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      {studentsLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          selectedStudentIds={selectedStudentIds}
          onToggleStudent={toggleStudent}
          onToggleAll={toggleAll}
          totalCount={allStudents.length}
          onViewPurchase={onViewPurchase}
          onClearDue={onClearDue}
        />
      )}
      {selectedStudentRecords.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <section
            className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[100] border-t border-outline-variant/20 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md md:bottom-6 md:left-1/2 md:right-auto md:w-auto md:max-w-lg md:-translate-x-1/2 md:rounded-2xl md:border md:px-6 md:py-4"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            aria-label="Proceed to order"
          >
            <ProceedButton onProceed={onProceedToConfigure} studentName={selectedStudentRecords[0]?.name} />
          </section>,
          document.body,
        )}
    </div>
  )
}
