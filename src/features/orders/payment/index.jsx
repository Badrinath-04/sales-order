import { useCallback, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ordersApi } from '@/services/api'
import Receipt from '../receipt/Receipt'
import OrderSummary from './components/OrderSummary'
import PaymentMethod from './components/PaymentMethod'
import ReceiptOptions from './components/ReceiptOptions'
import SuccessModal from './components/SuccessModal'
import { fallbackPaymentContext } from './data'
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
    .map((i) => ({ label: i.label, price: Number(i.unitPrice) }))

  const uniformKit = orderItems
    .filter((i) => i.itemType === 'UNIFORM')
    .map((i) => ({ label: i.label, price: Number(i.unitPrice) }))

  const subtotal = totals?.total ? totals.total - 5 : orderItems.reduce((s, i) => s + Number(i.unitPrice), 0)
  return {
    bookKit: bookKit.length ? bookKit : [{ label: 'Academic Kit', price: subtotal }],
    uniformKit,
    subtotal,
    administrativeFee: 5,
    total: totals?.total ?? (subtotal + 5),
  }
}

const PAYMENT_METHOD_MAP = {
  cash: 'CASH',
  online: 'ONLINE',
  card: 'CARD',
  cheque: 'CHEQUE',
  bank: 'BANK_TRANSFER',
  gpay: 'GPAY',
  phonepe: 'PHONEPE',
  paytm: 'PAYTM',
  credit: 'CREDIT',
  other: 'OTHER',
}

export default function OrderPayment() {
  const location = useLocation()
  const {
    selectedStudents = [],
    selectedClass: stClass,
    selectedSection: stSection,
    orderItems,
    totals,
    branchId,
  } = location.state ?? {}

  const fb = fallbackPaymentContext
  const selectedClass = stClass ?? fb.selectedClass
  const selectedSection = stSection ?? fb.selectedSection
  const student = selectedStudents[0] ?? fb.student
  const orderDetails = buildOrderDetails(orderItems, totals)

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [remarks, setRemarks] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const printAreaRef = useRef(null)

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

  const handleComplete = useCallback(async () => {
    if (submitting) return
    setSubmitError('')
    setSubmitting(true)

    try {
      const apiMethod = PAYMENT_METHOD_MAP[paymentMethod] ?? 'CASH'

      if (student.id && branchId && orderItems?.length) {
        const created = await ordersApi.create({
          studentId: student.id,
          branchId,
          items: orderItems,
        })
        const orderId = created?.data?.data?.id ?? created?.data?.id
        if (orderId) {
          const payResult = await ordersApi.processPayment(orderId, {
            amount: orderDetails.total,
            paymentMethod: apiMethod,
            notes: remarks || undefined,
          })
          const realOrderId = payResult?.data?.data?.order?.orderId ?? payResult?.data?.order?.orderId
          if (realOrderId) {
            setReceiptInfo((prev) => ({ ...prev, orderId: realOrderId }))
          }
        }
      }

      setShowSuccess(true)
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? 'Payment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, paymentMethod, student, branchId, orderItems, orderDetails])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant/10 bg-white/80 px-8 py-4 shadow-sm backdrop-blur-xl dark:bg-stone-900/80 dark:shadow-none">
        <div className="flex flex-col">
          <h1 className="font-headline text-lg font-semibold text-on-surface">Order Payment</h1>
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>{selectedClass.name}</span>
            <span className="material-symbols-outlined text-[10px]" aria-hidden>chevron_right</span>
            <span className="text-primary">{selectedSection.name}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-12 pt-6 md:px-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className="space-y-10 lg:col-span-7">
            <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} remarks={remarks} onRemarksChange={setRemarks} />
            <ReceiptOptions onPrint={handlePrint} />
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
            onComplete={handleComplete}
            submitting={submitting}
          />
        </div>
      </main>
      <div ref={printAreaRef} className="print-area">
        <Receipt
          student={student}
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          orderDetails={orderDetails}
          paymentMethod={paymentMethod}
          orderId={receiptInfo.orderId}
          receiptDate={receiptDate}
          receiptTime={receiptTime}
          onPrint={handlePrint}
        />
      </div>
      <SuccessModal open={showSuccess} onClose={dismissSuccess} onViewReceipt={handleViewReceipt} />
    </div>
  )
}
