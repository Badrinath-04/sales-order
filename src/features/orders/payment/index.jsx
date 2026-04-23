import { useCallback, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
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

export default function OrderPayment() {
  const location = useLocation()
  const {
    selectedStudents = [],
    selectedClass: stClass,
    selectedSection: stSection,
    orderDetails: stOrderDetails,
  } = location.state ?? {}

  const fb = fallbackPaymentContext
  const selectedClass = stClass ?? fb.selectedClass
  const selectedSection = stSection ?? fb.selectedSection
  const student = selectedStudents[0] ?? fb.student
  const orderDetails = stOrderDetails ?? fb.orderDetails

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showSuccess, setShowSuccess] = useState(false)
  const printAreaRef = useRef(null)

  const [{ issuedAt, orderId }] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const n = Math.floor(1000 + Math.random() * 9000)
    return { issuedAt: d, orderId: `#SKM-${y}-${n}` }
  })
  const receiptDate = formatReceiptDate(issuedAt)
  const receiptTime = formatReceiptTime(issuedAt)

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const scrollToReceipt = useCallback(() => {
    printAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const dismissSuccess = useCallback(() => setShowSuccess(false), [])

  const handleViewReceipt = useCallback(() => {
    setShowSuccess(false)
    scrollToReceipt()
  }, [scrollToReceipt])

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant/10 bg-white/80 px-8 py-4 shadow-sm backdrop-blur-xl dark:bg-stone-900/80 dark:shadow-none">
        <div className="flex flex-col">
          <h1 className="font-headline text-lg font-semibold text-on-surface">Order Payment</h1>
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>{selectedClass.name}</span>
            <span className="material-symbols-outlined text-[10px]" data-icon="chevron_right" aria-hidden>
              chevron_right
            </span>
            <span className="text-primary">{selectedSection.name}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-12 pt-6 md:px-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className="space-y-10 lg:col-span-7">
            <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
            <ReceiptOptions onPrint={handlePrint} />
          </section>
          <OrderSummary
            student={student}
            selectedClass={selectedClass}
            selectedSection={selectedSection}
            orderDetails={orderDetails}
            onComplete={() => setShowSuccess(true)}
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
          orderId={orderId}
          receiptDate={receiptDate}
          receiptTime={receiptTime}
          onPrint={handlePrint}
        />
      </div>
      <SuccessModal open={showSuccess} onClose={dismissSuccess} onViewReceipt={handleViewReceipt} />
    </div>
  )
}
