import { useMemo, useState } from 'react'
import FilterBar from './FilterBar'
import HeaderStats from './HeaderStats'
import ProceedButton from './ProceedButton'
import SelectedStudentsBar from './SelectedStudentsBar'
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
      <HeaderStats contextTitle={contextTitle} roster={rosterStats} />
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      {studentsLoading ? (
        <p className="py-8 text-sm text-on-surface-variant">Loading students…</p>
      ) : (
        <StudentTable
          students={filteredStudents}
          selectedStudentIds={selectedStudentIds}
          onToggleStudent={toggleStudent}
          onToggleAll={toggleAll}
          totalCount={allStudents.length}
        />
      )}
      {selectedStudentRecords.length > 0 ? (
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4">
          <SelectedStudentsBar selectedStudents={selectedStudentRecords} />
          <ProceedButton onProceed={onProceedToConfigure} />
        </div>
      ) : null}
    </div>
  )
}
