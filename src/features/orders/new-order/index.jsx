import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import Breadcrumb from './components/Breadcrumb'
import ClassGrid from './components/ClassGrid'
import QuickEnroll from './components/QuickEnroll'
import SectionSelector from './components/SectionSelector'
import StudentDistribution from './components/StudentDistribution'
import { classes, sections, students as allStudents } from './data'
import './styles.scss'

export default function NewOrderSelection() {
  const navigate = useNavigate()
  const paths = useShellPaths()
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const studentSectionRef = useRef(null)

  const handleProceedToConfigure = () => {
    if (!selectedClass || !selectedSection) return
    const records = allStudents.filter((s) => selectedStudents.includes(s.id))
    navigate(paths.ordersConfigure, {
      state: {
        selectedStudents: records,
        selectedClass,
        selectedSection,
      },
    })
  }

  useEffect(() => {
    if (selectedSection && studentSectionRef.current) {
      studentSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [selectedSection])

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
    if (segment === 'new-selection') {
      setSelectedClass(null)
      setSelectedSection(null)
      setSelectedStudents([])
    }
    if (segment === 'orders') {
      setSelectedClass(null)
      setSelectedSection(null)
      setSelectedStudents([])
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-white/80 px-6 py-3 shadow-sm backdrop-blur-xl dark:bg-neutral-900/80">
        <div className="flex flex-1 items-center gap-8">
          <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text font-headline text-xl font-bold tracking-tight text-transparent">
            SchoolKit Pro
          </span>
          <div className="relative w-full max-w-md">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-neutral-400"
              data-icon="search"
              aria-hidden
            >
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
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
              notifications
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined" data-icon="settings" aria-hidden>
              settings
            </span>
          </button>
          <div className="ml-2 h-8 w-8 overflow-hidden rounded-full ring-2 ring-primary/10">
            <img
              alt="User profile"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXsSTSdUCNWdCcD779QiAN02x5ed3-TnYQL46Z6k9tUwZUzYgoNin2DN9jHlHfz7lZWp0HGoZHj5WYsfMT8UUUtRZxfkbX-ZTBvP4mJ4M15jqvrzr114_fUK-zD_J8qhzMPNmcMY77IoMpoSLjQmMU0TKI-rDwJZWOGc120qKSOVdnl23r0B_xwPpzlHn1iGjxzqhgtLtFdd97q0zwLaR60zIo1lxbb50kaNbRjl-VNUC6kERiONPgbUKsMnliM4JjZ6GJMazxkW0"
            />
          </div>
        </div>
      </header>
      <div
        className={`mx-auto max-w-7xl p-8 ${selectedSection ? 'pb-32' : ''}`}
      >
        <Breadcrumb
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          onNavigate={handleBreadcrumbNavigate}
        />
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              New Order Selection
            </h1>
            <p className="font-body text-on-surface-variant">
              Choose a class to begin the enrollment kit distribution
            </p>
          </div>
          <QuickEnroll />
        </div>
        <ClassGrid classes={classes} selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        {selectedClass ? (
          <SectionSelector
            key={selectedClass.id}
            selectedClassName={selectedClass.name}
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={handleSelectSection}
          />
        ) : null}
        {selectedClass && selectedSection ? (
          <div ref={studentSectionRef}>
            <StudentDistribution
              key={`${selectedClass.id}-${selectedSection.id}`}
              selectedClass={selectedClass}
              selectedSection={selectedSection}
              selectedStudentIds={selectedStudents}
              onSelectedStudentIdsChange={setSelectedStudents}
              onProceedToConfigure={handleProceedToConfigure}
            />
          </div>
        ) : null}
        <div className="relative mt-16 overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-primary/5 to-secondary-container/20 p-12 text-center">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" aria-hidden />
          <div className="relative z-10 mx-auto max-w-lg">
            <span className="material-symbols-outlined mb-4 text-6xl text-primary/40" data-icon="inventory_2" aria-hidden>
              inventory_2
            </span>
            <h3 className="mb-3 font-headline text-xl font-bold text-primary">Smart Inventory Management</h3>
            <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
              Once you select a section, ScholarFlow automatically calculates the required kit inventory based on
              the current class curriculum and student list.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-xl" data-icon="info" aria-hidden>
                info
              </span>
              Learn About Auto-Allocation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
