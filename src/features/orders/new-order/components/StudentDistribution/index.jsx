import { forwardRef, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import {
  printStudentRosterInNewWindow,
  shouldUseDedicatedPrintWindow,
} from '../../studentRosterPrintWindow'
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
  canPlaceOrders = true,
  onViewPurchase,
  onClearDue,
  onOpenAddStudent,
  branchName = 'Branch',
  generatedBy = 'Admin',
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [printedAt, setPrintedAt] = useState(() => new Date())
  const printAreaRef = useRef(null)

  const contextTitle = `${selectedClass.name} — ${selectedSection.name}`

  const rosterStats = {
    totalStudents: allStudents.length,
    unpaidCount: allStudents.filter((s) => s.payment === 'Unpaid').length,
    kitsDistributedCount: allStudents.filter((s) => s.books === 'Taken').length,
    partiallyGivenCount: allStudents.filter((s) => s.books === 'Partial').length,
    pendingPayments: allStudents.filter((s) => s.books === 'Not Taken').length,
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

  const handlePrintRoster = () => {
    flushSync(() => {
      setPrintedAt(new Date())
    })

    const previousTitle = document.title
    const printTitle = `Student Roster — ${contextTitle}`
    document.title = printTitle

    if (shouldUseDedicatedPrintWindow()) {
      const contentHtml = printAreaRef.current?.innerHTML
      const opened = printStudentRosterInNewWindow({
        title: printTitle,
        contentHtml,
      })
      document.title = previousTitle
      if (opened) return
    }

    const cleanup = () => {
      document.body.classList.remove('student-roster-print-active')
      document.title = previousTitle
    }

    const onBeforePrint = () => {
      document.body.classList.add('student-roster-print-active')
    }
    const onAfterPrint = () => {
      cleanup()
      window.removeEventListener('beforeprint', onBeforePrint)
    }

    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint, { once: true })

    document.body.classList.add('student-roster-print-active')

    const runPrint = () => {
      window.print()
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(runPrint)
    })
  }

  const toggleStudent = (id) => {
    if (!canPlaceOrders) return
    onSelectedStudentIdsChange((prev) =>
      prev.includes(id) ? [] : [id],
    )
  }

  const toggleAll = (pageIds) => {
    if (!canPlaceOrders) return
    const allPageSelected = pageIds.every((id) => selectedStudentIds.includes(id))
    if (allPageSelected) {
      onSelectedStudentIdsChange((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      onSelectedStudentIdsChange((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  return (
    <div className="student-distribution-reveal pb-24">
      <HeaderStats
        contextTitle={contextTitle}
        roster={rosterStats}
        onOpenAddStudent={onOpenAddStudent}
        onPrintRoster={handlePrintRoster}
      />
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
      {canPlaceOrders && selectedStudentRecords.length > 0 &&
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
      {typeof document !== 'undefined' &&
        createPortal(
          <StudentRosterPrintReport
            ref={printAreaRef}
            contextTitle={contextTitle}
            branchName={branchName}
            generatedBy={generatedBy}
            printedAt={printedAt}
            students={allStudents}
          />,
          document.body,
        )}
    </div>
  )
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const StudentRosterPrintReport = forwardRef(function StudentRosterPrintReport(
  { contextTitle, branchName, generatedBy, printedAt, students },
  ref,
) {
  return (
    <div ref={ref} className="student-roster-print-area">
    <section className="student-roster-print-report">
      <header className="student-roster-print-header">
        <div>
          <h1>School Kit Manager</h1>
          <p>{contextTitle}</p>
        </div>
        <dl className="student-roster-print-meta-grid">
          <dt>Branch</dt>
          <dd>{branchName}</dd>
          <dt>Total Students</dt>
          <dd>{students.length}</dd>
          <dt>Printed on</dt>
          <dd>{formatDateTime(printedAt)}</dd>
          <dt>Generated by</dt>
          <dd>{generatedBy}</dd>
        </dl>
      </header>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Student Name</th>
            <th>Parent Name</th>
            <th>Phone Number</th>
            <th>Book Status</th>
            <th>Date Taken</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={student.id}>
              <td>{idx + 1}</td>
              <td>{student.name}</td>
              <td>{student.guardian && student.guardian !== 'N/A' ? student.guardian : '—'}</td>
              <td>{student.parentPhone || '—'}</td>
              <td>{student.books}</td>
              <td>{formatDate(student.latestOrderDate)}</td>
              <td>{student.remarks || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="student-roster-print-footer">
        Confidential — School Kit Manager
      </footer>
    </section>
    </div>
  )
})

StudentRosterPrintReport.displayName = 'StudentRosterPrintReport'
