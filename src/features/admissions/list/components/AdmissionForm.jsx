import { useMemo, useState } from 'react'
import { SCHOOL_CLASSES, classLabelForGrade } from '@/utils/classes'

const inputClass =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary'

export default function AdmissionForm({
  branches,
  showBranchSelect,
  branchId: effectiveBranchId,
  onBranchChange,
  defaultAmount,
  sectionsByGrade,
  submitting,
  onSubmit,
}) {
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [section, setSection] = useState('')
  const [amount, setAmount] = useState('500')
  const [appliedDefault, setAppliedDefault] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [touched, setTouched] = useState(false)

  // Adjust the prefilled amount when the default loads/changes, but only while
  // the user hasn't customized it away from the previously-applied default.
  if (defaultAmount != null && defaultAmount !== appliedDefault) {
    const shouldApply = appliedDefault == null || amount === String(appliedDefault)
    setAppliedDefault(defaultAmount)
    if (shouldApply) setAmount(String(defaultAmount))
  }

  const sections = useMemo(() => {
    if (grade === '' || grade === null) return []
    return sectionsByGrade?.[Number(grade)] ?? []
  }, [grade, sectionsByGrade])

  const isValid =
    studentName.trim().length > 0 &&
    phone.trim().length > 0 &&
    grade !== '' &&
    section !== '' &&
    Number(amount) > 0 &&
    (!showBranchSelect || Boolean(effectiveBranchId))

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!isValid || submitting) return

    const gradeNum = Number(grade)
    onSubmit({
      studentName: studentName.trim(),
      parentName: parentName.trim() || undefined,
      phone: phone.trim(),
      branchId: effectiveBranchId,
      grade: gradeNum,
      section,
      classLabel: `${classLabelForGrade(gradeNum)}-${section}`,
      amount: Number(amount),
      remarks: remarks.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Student Name *</label>
          <input className={inputClass} value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Aarav Sharma" />
          {touched && !studentName.trim() && <p className="mt-1 text-xs text-error">Student name is required.</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Parent Name</label>
          <input className={inputClass} value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Phone Number *</label>
          <input
            className={inputClass}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s]/g, ''))}
            placeholder="10-digit mobile number"
          />
          {touched && !phone.trim() && <p className="mt-1 text-xs text-error">Phone number is required.</p>}
        </div>
        {showBranchSelect && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Branch *</label>
            <select
              className={inputClass}
              value={effectiveBranchId ?? ''}
              onChange={(e) => { onBranchChange(e.target.value); setSection('') }}
            >
              <option value="" disabled>Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Class *</label>
          <select
            className={inputClass}
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setSection('') }}
          >
            <option value="" disabled>Select class</option>
            {SCHOOL_CLASSES.map((c) => (
              <option key={c.grade} value={c.grade}>{c.label}</option>
            ))}
          </select>
          {touched && grade === '' && <p className="mt-1 text-xs text-error">Class is required.</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Section *</label>
          <select className={inputClass} value={section} onChange={(e) => setSection(e.target.value)} disabled={grade === ''}>
            <option value="" disabled>Select section</option>
            {sections.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
          {touched && section === '' && <p className="mt-1 text-xs text-error">Section is required.</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Admission Fee (₹) *</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-on-surface-variant">Defaults to ₹{Number(defaultAmount ?? 500).toFixed(0)} — fully editable per student.</p>
          {touched && Number(amount) <= 0 && <p className="mt-1 text-xs text-error">Enter an amount greater than zero.</p>}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Remarks (optional)</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Sibling of existing student, discount discussed at front desk..."
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 md:w-auto"
      >
        {submitting ? 'Saving…' : 'Proceed to Payment'}
      </button>
    </form>
  )
}
