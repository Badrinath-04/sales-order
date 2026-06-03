import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { branchesApi, ordersApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { useShellPaths } from '@/hooks/useShellPaths'
import { useApi } from '@/hooks/useApi'
import Receipt from '../receipt/Receipt'
import OrderSummary from './components/OrderSummary'
import PaymentMethod from './components/PaymentMethod'
import ReceiptOptions from './components/ReceiptOptions'
import SuccessModal from './components/SuccessModal'
import { fallbackPaymentContext } from './data'
import { useSidebar } from '@/context/SidebarContext'
import { CHECKOUT_TO_API_PAYMENT_METHOD, paymentMethodLabel } from '@/constants/paymentMethods'
import './styles.scss'

function formatReceiptDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatReceiptTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function buildOrderDetails(orderItems, totals) {
  if (!orderItems?.length) return fallbackPaymentContext.orderDetails

  const bookKit = orderItems
    .filter((i) => i.itemType === 'BOOK')
    .map((i) => ({ label: i.label, price: Number(i.unitPrice) * Number(i.quantity ?? 1) }))

  const uniformKit = orderItems
    .filter((i) => i.itemType === 'UNIFORM')
    .map((i) => ({ label: i.label, price: Number(i.unitPrice) * Number(i.quantity ?? 1) }))

  const subtotal = totals?.total ?? orderItems.reduce((s, i) => s + Number(i.unitPrice), 0)
  return {
    bookKit: bookKit.length ? bookKit : [{ label: 'Academic Kit', price: subtotal }],
    uniformKit,
    subtotal,
    administrativeFee: 0,
    total: totals?.total ?? subtotal,
  }
}

const PAYMENT_METHOD_MAP = CHECKOUT_TO_API_PAYMENT_METHOD

export default function OrderPayment() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { toggle: toggleSidebar } = useSidebar()
  const {
    selectedStudents = [],
    selectedClass: stClass,
    selectedSection: stSection,
    orderItems,
    totals,
    branchId,
    existingOrderId = null,
    existingOrderNumber = null,
    dueAmount: incomingDueAmount = null,
    totalAmount: incomingTotalAmount = null,
    paidAmount: incomingPaidAmount = null,
  } = location.state ?? {}

  const fb = fallbackPaymentContext
  const selectedClass = stClass ?? fb.selectedClass
  const selectedSection = stSection ?? fb.selectedSection
  const student = selectedStudents[0] ?? fb.student
  const fetchBranch = useCallback(() => (branchId ? branchesApi.getOne(branchId) : null), [branchId])
  const { data: branchData } = useApi(fetchBranch, null, [branchId])
  const branchName = branchData?.name ?? ''
  const isDueSettlement = Boolean(existingOrderId && Number(incomingDueAmount) > 0)
  const dueAmount = Math.max(0, Number(incomingDueAmount ?? 0))
  const orderDetails = isDueSettlement
    ? {
        bookKit: [
          {
            label: `Pending due for order ${existingOrderNumber ?? '—'}`,
            price: dueAmount,
          },
        ],
        uniformKit: [],
        subtotal: dueAmount,
        administrativeFee: 0,
        total: dueAmount,
        totalAmount: Number(incomingTotalAmount ?? 0),
        paidAmount: Number(incomingPaidAmount ?? 0),
      }
    : buildOrderDetails(orderItems, totals)
  const [discountAmount, setDiscountAmount] = useState('0')
  const [paymentSplit, setPaymentSplit] = useState({
    firstMethod: 'cash',
    firstAmount: String(orderDetails.total ?? 0),
    enableSplit: false,
    secondMethod: '',
  })
  const [showQuickNoteTemplates, setShowQuickNoteTemplates] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [receiptOrderNotes, setReceiptOrderNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [receiptFinancials, setReceiptFinancials] = useState({
    totalAmount: Number(orderDetails.total ?? 0),
    paidAmount: 0,
    dueAmount: Number(orderDetails.total ?? 0),
    paymentStatus: 'UNPAID',
    paymentEntries: [],
  })
  const [duplicateInfo, setDuplicateInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const printAreaRef = useRef(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])
  const submitInFlightRef = useRef(false)

  const discountValue = isDueSettlement ? 0 : Math.max(0, Number(discountAmount || 0))
  const finalPayable = Math.max(0, Number(orderDetails.total || 0) - discountValue)
  const firstAmount = Math.min(Math.max(Number(paymentSplit.firstAmount || 0), 0), finalPayable)
  const remainingAmount = Math.max(0, finalPayable - firstAmount)
  const paymentEntries = (paymentSplit.enableSplit && paymentSplit.secondMethod)
    ? [
        { method: paymentSplit.firstMethod, amount: firstAmount },
        { method: paymentSplit.secondMethod, amount: remainingAmount },
      ].filter((row) => row.amount > 0)
    : [{ method: paymentSplit.firstMethod, amount: finalPayable }]
  const paidNow = paymentEntries.reduce(
    (sum, row) => sum + (String(row.method).toLowerCase() === 'credit' ? 0 : Number(row.amount || 0)),
    0,
  )
  const remainingDue = Math.max(0, Number(finalPayable) - paidNow)

  const bookLabels = (orderDetails.bookKit ?? []).map((row) => row.label).slice(0, 8)
  const noteTemplateGroups = [
    {
      group: 'Missing from bundle',
      items: bookLabels.map((label) => `Missing from bundle: ${label}.`),
    },
    {
      group: 'Out of stock',
      items: bookLabels.map((label) => `Out of stock: ${label}. Will be provided later.`),
    },
    {
      group: 'Will deliver later',
      items: bookLabels.map((label) => `Delayed delivery: ${label}. Scheduled for later issue.`),
    },
    {
      group: 'Parent requested skip',
      items: bookLabels.map((label) => `Parent requested skip for: ${label}.`),
    },
  ]

  const [receiptInfo, setReceiptInfo] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const n = Math.floor(1000 + Math.random() * 9000)
    return {
      issuedAt: d,
      orderId: `#SKM-${y}-${n}`,
    }
  })

  const receiptDate = formatReceiptDate(receiptInfo.issuedAt)
  const receiptTime = formatReceiptTime(receiptInfo.issuedAt)

  const handlePrint = useCallback(() => window.print(), [])

  const scrollToReceipt = useCallback(() => {
    printAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const dismissSuccess = useCallback(() => setShowSuccess(false), [])

  const handleViewReceipt = useCallback(() => {
    setShowSuccess(false)
    scrollToReceipt()
  }, [scrollToReceipt])

  const handleNewOrder = useCallback(() => {
    setShowSuccess(false)
    navigate(paths.ordersNew, { replace: true })
  }, [navigate, paths.ordersNew])

  const buildReceiptFinancials = useCallback((order, payments) => {
    const total = Number(order?.total ?? finalPayable)
    const paid = Number(order?.paidAmount ?? paidNow)
    const due = Math.max(0, total - paid)
    const receiptPayments =
      finalPayable === 0 ? [{ method: 'other', amount: 0 }] : (payments ?? paymentEntries)
    return {
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus:
        order?.paymentStatus ?? (due > 0 ? (paid > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID'),
      paymentEntries: receiptPayments,
    }
  }, [finalPayable, paidNow, paymentEntries])

  const handleComplete = useCallback(async () => {
    if (submitting || orderCompleted || submitInFlightRef.current) return
    setSubmitError('')
    setDuplicateInfo(null)
    submitInFlightRef.current = true
    setSubmitting(true)

    const releaseSubmitLock = () => {
      setSubmitting(false)
      submitInFlightRef.current = false
    }

    const showCheckoutSuccess = (financials) => {
      setReceiptFinancials(financials)
      setOrderCompleted(true)
      window.dispatchEvent(new CustomEvent('skm-order-confirmed', { detail: { studentId: student.id } }))
      setShowSuccess(true)
      releaseSubmitLock()
    }

    const refreshOrderInBackground = (orderPk, fallbackOrder, payments) => {
      void (async () => {
        try {
          const refreshedOrderRes = await ordersApi.getOne(orderPk)
          const refreshedOrder =
            refreshedOrderRes?.data?.data ?? refreshedOrderRes?.data ?? fallbackOrder
          setReceiptFinancials(buildReceiptFinancials(refreshedOrder, payments))
        } catch (err) {
          console.error('[checkout.complete] background refresh failed', err?.message ?? err)
          toast.error('Order saved. If the receipt looks wrong, check Transactions.')
        }
      })()
    }

    const runPaymentsInBackground = (orderPk, paymentsToRun, fallbackOrder, paymentsForReceipt) => {
      void (async () => {
        try {
          let latest = fallbackOrder
          for (const [idx, entry] of paymentsToRun.entries()) {
            if (Number(entry.amount) <= 0) continue
            const apiMethod = PAYMENT_METHOD_MAP[entry.method] ?? 'CASH'
            const payResult = await ordersApi.processPayment(orderPk, {
              amount: entry.amount,
              paymentMethod: apiMethod,
              notes:
                idx === 0
                  ? (remarks || undefined)
                  : `Split payment via ${paymentMethodLabel(entry.method)}`,
            })
            const realOrderId =
              payResult?.data?.data?.order?.orderId ?? payResult?.data?.order?.orderId
            if (realOrderId) {
              setReceiptInfo((prev) => ({ ...prev, orderId: realOrderId }))
            }
            latest = payResult?.data?.data?.order ?? payResult?.data?.order ?? latest
          }
          refreshOrderInBackground(orderPk, latest, paymentsForReceipt)
        } catch (err) {
          console.error('[checkout.complete] background payment failed', err?.message ?? err)
          toast.error(err?.response?.data?.message ?? 'Payment could not be completed. Check Transactions.')
        }
      })()
    }

    try {
      let persistedOrderId = existingOrderId
      if (isDueSettlement && existingOrderId) {
        setReceiptOrderNotes(orderNotes.trim())
        let latestOrderPayload = null
        for (const [idx, entry] of paymentEntries.entries()) {
          const apiMethod = PAYMENT_METHOD_MAP[entry.method] ?? 'CASH'
          const payResult = await ordersApi.processPayment(existingOrderId, {
            amount: entry.amount,
            paymentMethod: apiMethod,
            notes:
              idx === 0
                ? (remarks || orderNotes || undefined)
                : `Split payment via ${paymentMethodLabel(entry.method)}`,
          })
          const realOrderId =
            payResult?.data?.data?.order?.orderId ?? payResult?.data?.order?.orderId
          if (realOrderId) {
            setReceiptInfo((prev) => ({ ...prev, orderId: realOrderId }))
          } else if (existingOrderNumber) {
            setReceiptInfo((prev) => ({ ...prev, orderId: existingOrderNumber }))
          }
          latestOrderPayload = payResult?.data?.data?.order ?? payResult?.data?.order ?? latestOrderPayload
        }
        showCheckoutSuccess(buildReceiptFinancials(latestOrderPayload, paymentEntries))
        refreshOrderInBackground(existingOrderId, latestOrderPayload, paymentEntries)
        return
      }

      if (student.id && branchId && orderItems?.length) {
        const trimmedNotes = orderNotes.trim()
        const createRes = await ordersApi.create({
          studentId: student.id,
          branchId,
          items: orderItems,
          totalAmount: Number(orderDetails.total ?? 0),
          discountAmount: discountValue,
          notes: trimmedNotes || undefined,
        })
        const payload = createRes?.data?.data ?? createRes?.data
        const createdOrder = payload?.order ?? payload
        const orderId = createdOrder?.id
        persistedOrderId = orderId
        const stockWarnings = Array.isArray(payload?.stockWarnings) ? payload.stockWarnings : []
        setReceiptOrderNotes(trimmedNotes)
        for (const w of stockWarnings) {
          toast.info(w, 7000)
        }
        if (createdOrder?.orderId) {
          setReceiptInfo((prev) => ({ ...prev, orderId: createdOrder.orderId }))
        }

        showCheckoutSuccess(buildReceiptFinancials(createdOrder, paymentEntries))

        if (orderId && finalPayable > 0) {
          const entries = paymentEntries.filter((e) => Number(e.amount) > 0)
          runPaymentsInBackground(orderId, entries, createdOrder, paymentEntries)
        } else if (orderId) {
          refreshOrderInBackground(orderId, createdOrder, paymentEntries)
        }
        return
      }

      releaseSubmitLock()
    } catch (err) {
      const duplicateError = err?.response?.data?.errors?.find((e) => e?.code === 'DUPLICATE_ORDER')
      if (duplicateError?.existingOrderId) {
        setDuplicateInfo({
          studentName: student.name,
          orderId: duplicateError.existingOrderId,
        })
      } else {
        setSubmitError(err?.response?.data?.message ?? 'Payment failed. Please try again.')
      }
      releaseSubmitLock()
    }
  }, [
    submitting,
    orderCompleted,
    student,
    branchId,
    orderItems,
    existingOrderId,
    existingOrderNumber,
    isDueSettlement,
    remarks,
    orderNotes,
    discountValue,
    paymentEntries,
    finalPayable,
    paidNow,
    buildReceiptFinancials,
    toast,
  ])

  const handleEdit = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex h-auto min-h-[64px] w-full items-center justify-between border-b border-outline-variant/10 bg-white/80 px-3 md:px-8 py-3 shadow-sm backdrop-blur-xl dark:bg-stone-900/80 dark:shadow-none">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="shrink-0 rounded-xl p-2 hover:bg-surface-container-low"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-on-surface" aria-hidden>menu</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline text-lg font-semibold text-on-surface">Order Payment</h1>
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <span>{selectedClass.name}</span>
              <span className="material-symbols-outlined text-[10px]" aria-hidden>chevron_right</span>
              <span className="text-primary">{selectedSection.name}</span>
            </nav>
            {isDueSettlement && (
              <p className="mt-0.5 text-xs font-semibold text-primary">
                Clearing pending due for {existingOrderNumber ?? 'existing order'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDueSettlement && (
            <button
              type="button"
              onClick={() => navigate(paths.transactions, { state: { activeTab: 'dues' } })}
              className="flex items-center gap-1 rounded-lg border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary hover:bg-secondary/15"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>list_alt</span>
              Back to Due List
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 rounded-lg border border-tertiary/25 bg-tertiary/10 px-3 py-1.5 text-xs font-bold text-tertiary hover:bg-tertiary/15"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden>arrow_back</span>
            Back
          </button>
        </div>
      </header>
      <main className="w-full px-4 pb-12 pt-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className="space-y-10 lg:col-span-7">
            <PaymentMethod
              payment={paymentSplit}
              onPaymentChange={setPaymentSplit}
              finalPayable={finalPayable}
              branchName={branchName}
              remarks={remarks}
              onRemarksChange={setRemarks}
            />
            {orderCompleted && <ReceiptOptions onPrint={handlePrint} />}
            {submitError && (
              <p className="rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
                {submitError}
              </p>
            )}
          </section>
          <OrderSummary
            student={student}
            selectedClass={selectedClass}
            selectedSection={selectedSection}
            orderDetails={orderDetails}
            orderNotes={orderNotes}
            onOrderNotesChange={setOrderNotes}
            noteTemplateGroups={noteTemplateGroups}
            showQuickNoteTemplates={showQuickNoteTemplates}
            onToggleQuickNoteTemplates={setShowQuickNoteTemplates}
            discountAmount={discountAmount}
            onDiscountAmountChange={isDueSettlement ? undefined : setDiscountAmount}
            finalPayable={finalPayable}
            paidNow={paidNow}
            remainingDue={remainingDue}
            paymentEntries={paymentEntries}
            onComplete={handleComplete}
            onEdit={isDueSettlement ? undefined : handleEdit}
            submitting={submitting}
            orderCompleted={orderCompleted}
            isDueSettlement={isDueSettlement}
          />
        </div>
      </main>
      {orderCompleted && (
        <div ref={printAreaRef} className="print-area">
          <Receipt
            student={student}
            selectedClass={selectedClass}
            selectedSection={selectedSection}
            orderDetails={orderDetails}
            orderNotes={receiptOrderNotes}
            paymentEntries={receiptFinancials.paymentEntries}
            paymentStatus={receiptFinancials.paymentStatus}
            totalAmount={receiptFinancials.totalAmount}
            paidAmount={receiptFinancials.paidAmount}
            dueAmount={receiptFinancials.dueAmount}
            orderId={receiptInfo.orderId}
            receiptDate={receiptDate}
            receiptTime={receiptTime}
            onPrint={handlePrint}
          />
        </div>
      )}
      <SuccessModal
        open={showSuccess}
        onClose={dismissSuccess}
        onViewReceipt={handleViewReceipt}
        onNewOrder={handleNewOrder}
      />
      {duplicateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-on-surface">Duplicate Order Detected</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              An order for {duplicateInfo.studentName} with the same items already exists today ({duplicateInfo.orderId}).
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDuplicateInfo(null)}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate(paths.transactionDetail(encodeURIComponent(duplicateInfo.orderId)))}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90"
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
