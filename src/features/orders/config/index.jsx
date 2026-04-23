import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import AcademicKit from './components/AcademicKit'
import OrderSummary from './components/OrderSummary'
import StudentProfile from './components/StudentProfile'
import UniformConfig from './components/UniformConfig'
import { buildOrderDetailsForPayment } from '../payment/orderDetails'
import { fallbackOrderContext } from './data'
import './styles.scss'

function computeTotals(academic, uniform) {
  let academicTotal = 120
  if (academic.textbooks) academicTotal += 85
  if (academic.notebooks) academicTotal += 25

  let uniformTotal = 0
  if (uniform.includeKit) {
    if (uniform.shirt) uniformTotal += 45
    if (uniform.trousers) uniformTotal += 65
    if (uniform.socks) uniformTotal += 15
  }

  return {
    academicTotal,
    uniformTotal,
    total: academicTotal + uniformTotal,
  }
}

export default function OrderConfiguration() {
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { selectedStudents = [], selectedClass: stClass, selectedSection: stSection } =
    location.state ?? {}

  const fb = fallbackOrderContext
  const selectedClass = stClass ?? fb.selectedClass
  const selectedSection = stSection ?? fb.selectedSection
  const student = selectedStudents[0] ?? fb.student

  const [academic, setAcademic] = useState({
    textbooks: true,
    notebooks: true,
    textbookOption: 'All Subjects',
    notebookOption: '200 pages',
  })

  const [uniform, setUniform] = useState({
    includeKit: true,
    shirt: true,
    trousers: true,
    socks: true,
    trousersWaist: '32 Waist',
    socksSize: 'L (9-12)',
  })

  const totals = useMemo(() => computeTotals(academic, uniform), [academic, uniform])
  const { uniformTotal, total } = totals

  const handleConfirmToPayment = () => {
    const t = computeTotals(academic, uniform)
    const orderDetails = buildOrderDetailsForPayment({ academic, uniform, totals: t })
    const studentsOut = selectedStudents.length > 0 ? selectedStudents : [student]
    navigate(paths.ordersPayment, {
      state: {
        selectedStudents: studentsOut,
        selectedClass,
        selectedSection,
        orderDetails,
      },
    })
  }

  return (
    <div className="order-config min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 ml-0 flex h-16 max-w-[calc(100%-16rem)] items-center justify-between bg-white/80 px-8 py-4 shadow-sm backdrop-blur-xl dark:bg-stone-900/80 dark:shadow-none">
        <div className="flex flex-col">
          <h1 className="font-headline text-lg font-semibold text-on-surface">Order Management</h1>
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>{selectedClass.name}</span>
            <span className="material-symbols-outlined text-[10px]" data-icon="chevron_right" aria-hidden>
              chevron_right
            </span>
            <span className="text-primary">{selectedSection.name}</span>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex w-64 items-center rounded-full bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-sm text-outline" data-icon="search" aria-hidden>
              search
            </span>
            <input
              className="w-full border-none bg-transparent font-body text-sm focus:ring-0"
              placeholder="Search order ID..."
              type="search"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="text-stone-500 transition-opacity hover:opacity-80 active:translate-y-0.5"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
                notifications
              </span>
            </button>
            <button
              type="button"
              className="text-stone-500 transition-opacity hover:opacity-80 active:translate-y-0.5"
              aria-label="Help"
            >
              <span className="material-symbols-outlined" data-icon="help_outline" aria-hidden>
                help_outline
              </span>
            </button>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/10 bg-surface-container-highest">
              <img
                alt="Admin User"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoz6FGnassnK4w9rZ8DAQDCeEO4Mjn-XlemXXrF8_lSsbpU6QCe6q-KGh4xYiQuKHiVAG9rszx2J2SD5Fvi6ziWEqd1f5pxHZnXgNVLTm6-YOAUlw7dxuCrZ-WN94SldNOKixAdUb4jMwlFlqvOJQ5HFo_DlX1niGTE7bgaQbigQtxwOyV6Ci8pwoCENxkaWuCnF5P-JBfpzlKcQI-j_M_iscWyFke5UoSzAtJCqoSyVA3-MrkhCDEaftywLQMQRf7rozFsydgMkk"
              />
            </div>
          </div>
        </div>
      </header>
      <main className="ml-0 min-h-screen p-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-8">
              <StudentProfile
                student={student}
                sectionId={selectedSection.id}
                onChangeStudent={() => navigate(paths.ordersNew)}
              />
              <AcademicKit value={academic} onChange={setAcademic} />
              <UniformConfig value={uniform} onChange={setUniform} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <OrderSummary
                student={student}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                academic={academic}
                uniform={uniform}
                uniformSubtotal={uniformTotal}
                totalAmount={total}
                onConfirm={handleConfirmToPayment}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
