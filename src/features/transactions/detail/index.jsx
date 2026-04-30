import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApi } from '@/hooks/useApi'
import { transactionsApi } from '@/services/api'
import { useShellPaths } from '@/hooks/useShellPaths'
import FinancialSummary from './components/FinancialSummary'
import OrderSummary from './components/OrderSummary'
import StudentInfo from './components/StudentInfo'
import Timeline from './components/Timeline'
import { buildTransactionDetailFromOrder } from './buildDetail'
import { useSidebar } from '@/context/SidebarContext'
import './styles.scss'

function statusBadgeClass(status) {
  if (status === 'Paid') return 'bg-secondary-container text-on-secondary-container'
  if (status === 'Partial') return 'bg-blue-100 text-blue-700'
  if (status === 'Credit') return 'bg-blue-100 text-blue-700'
  if (status === 'Pending') return 'bg-amber-100 text-amber-800'
  return 'bg-surface-container-high text-on-surface-variant'
}

export default function TransactionDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { toggle: toggleSidebar } = useSidebar()
  const incomingReorderState = location.state?.reorderState

  const resolvedId = useMemo(() => decodeURIComponent(String(id ?? '')), [id])
  const fetchDetail = useCallback(() => transactionsApi.getOne(resolvedId), [resolvedId])
  const { data: detailOrder, loading } = useApi(fetchDetail, null, [resolvedId])

  const detail = useMemo(
    () => buildTransactionDetailFromOrder(detailOrder ?? {}),
    [detailOrder],
  )
  const canClearDue = Number(detail?.financial?.dueAmount ?? 0) > 0
  const reorderState = incomingReorderState ?? detail.reorderState
  const canReorder = Boolean(reorderState?.selectedStudents?.[0]?.id && reorderState?.selectedClass && reorderState?.selectedSection && reorderState?.branchId)

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <header className="tonal-layering fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant/10 px-3 md:px-8 backdrop-blur-xl lg:left-64">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Hamburger for mobile */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-xl p-2 hover:bg-surface-container-highest/50 lg:hidden shrink-0"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden>menu</span>
          </button>
          <nav className="flex items-center gap-3 md:gap-6 font-headline text-sm font-medium overflow-x-auto no-scrollbar">
            <span className="border-b-2 border-primary py-5 font-bold text-primary whitespace-nowrap">History</span>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest/50 whitespace-nowrap"
            >
              Purchase Timeline
            </button>
            {canReorder && (
              <button
                type="button"
                onClick={() => navigate(paths.ordersConfigure, { state: reorderState })}
                className="rounded-lg px-2 py-1 font-semibold text-primary transition-colors hover:bg-primary/5 whitespace-nowrap"
              >
                Place New Order
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="group relative hidden md:block">
            <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant/50">
              <span className="material-symbols-outlined text-[20px]" data-icon="search" aria-hidden>
                search
              </span>
            </span>
            <input
              className="w-48 lg:w-64 rounded-full border-none bg-surface-container-highest/50 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Search transactions..."
              type="search"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest/50"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
              notifications
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pb-12 pt-20 md:pt-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                aria-label="Back"
              >
                <span className="material-symbols-outlined" data-icon="arrow_back" aria-hidden>
                  arrow_back
                </span>
              </button>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                {detail.orderId}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusBadgeClass(detail.status)}`}
              >
                {detail.status}
              </span>
            </div>
            <p className="ml-12 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm" data-icon="calendar_today" aria-hidden>
                calendar_today
              </span>
              {detail.orderedLine}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canClearDue && detail.clearDueState?.existingOrderId && (
              <button
                type="button"
                onClick={() => navigate(paths.ordersPayment, { state: detail.clearDueState })}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="payments" aria-hidden>
                  payments
                </span>
                Clear Due
              </button>
            )}
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-surface-container-lowest px-5 py-2.5 font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="print" aria-hidden>
                print
              </span>
              Print Receipt
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-surface-container-lowest px-5 py-2.5 font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="download" aria-hidden>
                download
              </span>
              Download PDF
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-error-container px-5 py-2.5 font-semibold text-on-error-container transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[20px]" data-icon="undo" aria-hidden>
                undo
              </span>
              Refund Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {loading ? (
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex animate-pulse flex-col gap-6 lg:col-span-2">
                  <div className="h-64 rounded-xl bg-surface-container-low" />
                  <div className="h-56 rounded-xl bg-surface-container-low" />
                </div>
                <div className="flex animate-pulse flex-col gap-6">
                  <div className="h-44 rounded-xl bg-surface-container-low" />
                  <div className="h-44 rounded-xl bg-surface-container-low" />
                  <div className="h-40 rounded-xl bg-surface-container-low" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-6 lg:col-span-2">
                <OrderSummary detail={detail} />
                <Timeline entries={detail.timeline ?? []} />
              </div>
              <div className="flex flex-col gap-6">
                <StudentInfo student={detail.student} />
                <FinancialSummary financial={detail.financial} />
                <div className="relative overflow-hidden rounded-xl bg-tertiary-fixed p-6 text-on-tertiary-fixed">
                  <div className="relative z-10">
                    <h4 className="mb-2 flex items-center gap-2 font-bold">
                      <span className="material-symbols-outlined" data-icon="help" aria-hidden>
                        help
                      </span>
                      Need Assistance?
                    </h4>
                    <p className="mb-4 text-xs leading-relaxed opacity-80">
                      Having trouble with this transaction or need to raise a dispute regarding the kit items?
                    </p>
                    <a className="inline-block font-label text-xs font-black underline decoration-2 underline-offset-4" href="#">
                      CONTACT FINANCE DEPT
                    </a>
                  </div>
                  <span
                    className="material-symbols-outlined absolute -bottom-4 -right-4 rotate-12 text-8xl opacity-10"
                    data-icon="support_agent"
                    aria-hidden
                  >
                    support_agent
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
