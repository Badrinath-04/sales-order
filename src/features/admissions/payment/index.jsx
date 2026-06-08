import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { admissionsApi } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { useShellPaths } from '@/hooks/useShellPaths'
import { useApi } from '@/hooks/useApi'
import AdmissionSummary from './components/AdmissionSummary'
import PaymentMethodGrid from './components/PaymentMethodGrid'
import AdmissionSuccessModal from './components/AdmissionSuccessModal'

export default function AdmissionPayment() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const { admissionId, admission: incomingAdmission = null } = location.state ?? {}

  const fetchAdmission = useCallback(
    () => (admissionId ? admissionsApi.getOne(admissionId) : null),
    [admissionId],
  )
  const { data: fetchedAdmission, refetch } = useApi(fetchAdmission, null, [admissionId])
  const admission = fetchedAdmission ?? incomingAdmission

  const amount = Number(admission?.amount ?? 0)
  const [paymentSplit, setPaymentSplit] = useState({
    firstMethod: 'CASH',
    firstAmount: String(amount || 0),
    enableSplit: false,
    secondMethod: '',
  })
  const [appliedAmount, setAppliedAmount] = useState(amount || 0)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const submitInFlightRef = useRef(false)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  // Keep the non-split amount synced to the loaded admission amount (derived during render).
  if (amount !== appliedAmount) {
    setAppliedAmount(amount)
    if (!paymentSplit.enableSplit) {
      setPaymentSplit((prev) => ({ ...prev, firstAmount: String(amount || 0) }))
    }
  }

  const handlePaymentChange = useCallback((updaterOrValue) => {
    setPaymentSplit((prev) => (typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue))
  }, [])

  const splitDetails = useMemo(() => {
    if (!paymentSplit.enableSplit) return null
    const firstAmount = Number(paymentSplit.firstAmount || 0)
    const remaining = Math.max(0, amount - firstAmount)
    return [
      { method: paymentSplit.firstMethod, amount: firstAmount },
      { method: paymentSplit.secondMethod, amount: remaining },
    ]
  }, [paymentSplit, amount])

  async function handleConfirm() {
    if (!admission || submitInFlightRef.current) return
    if (!paymentSplit.firstMethod) {
      toast.error('Select a payment method to continue')
      return
    }
    if (paymentSplit.enableSplit && (!paymentSplit.secondMethod || Number(paymentSplit.firstAmount || 0) <= 0)) {
      toast.error('Enter a valid split amount and second payment method')
      return
    }

    submitInFlightRef.current = true
    setSubmitting(true)
    try {
      const paymentMethod = paymentSplit.enableSplit ? 'SPLIT' : paymentSplit.firstMethod
      await admissionsApi.processPayment(admission.id, {
        amount,
        paymentMethod,
        splitDetails: paymentSplit.enableSplit ? splitDetails : undefined,
        remarks: remarks.trim() || undefined,
      })
      toast.success('Payment recorded — admission marked as Paid.')
      setShowSuccess(true)
      refetch?.()
    } catch (err) {
      toast.error(err.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
      submitInFlightRef.current = false
    }
  }

  function goToList() {
    navigate(paths.admissions, { replace: true })
  }

  function goToNewAdmission() {
    navigate(paths.admissions, { replace: true, state: { openForm: true } })
  }

  if (!admission) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">error_outline</span>
        <p className="text-sm font-medium text-on-surface">No admission record selected</p>
        <button
          type="button"
          onClick={() => navigate(paths.admissions)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary"
        >
          Back to Admissions
        </button>
      </div>
    )
  }

  const alreadyPaid = admission.paymentStatus === 'PAID'

  return (
    <div className="pb-12">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(paths.admissions)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-on-surface">Collect Admission Payment</h1>
          <p className="text-sm text-on-surface-variant">{admission.admissionCode} — {admission.studentName}</p>
        </div>
      </div>

      {alreadyPaid ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-center">
          <span className="material-symbols-outlined text-3xl text-green-600">verified</span>
          <p className="text-sm font-semibold text-on-surface">This admission has already been paid.</p>
          <button
            type="button"
            onClick={goToList}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary"
          >
            Back to Admissions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-8">
              <PaymentMethodGrid
                payment={paymentSplit}
                onPaymentChange={handlePaymentChange}
                amount={amount}
                remarks={remarks}
                onRemarksChange={setRemarks}
              />
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirm}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? 'Processing…' : `Confirm Payment — ₹${amount.toFixed(2)}`}
              </button>
            </div>
          </div>
          <AdmissionSummary admission={admission} />
        </div>
      )}

      <AdmissionSuccessModal
        open={showSuccess}
        onClose={goToList}
        onViewList={goToList}
        onNewAdmission={goToNewAdmission}
      />
    </div>
  )
}
