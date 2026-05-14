import { useState } from 'react'
import { branchesApi } from '@/services/api'

export default function AddStudentModal({ branchId, classId, className, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', rollNumber: '', fatherName: '', contactNo: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Student name is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await branchesApi.createStudent(branchId, {
        classId,
        name: form.name.trim(),
        rollNumber: form.rollNumber.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        contactNo: form.contactNo.trim() || undefined,
      })
      const student = res?.data?.data ?? res?.data
      onAdded(student)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to add student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface">Add Student</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{className}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Student Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Full name"
              autoFocus
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Roll Number
            </label>
            <input
              type="text"
              value={form.rollNumber}
              onChange={(e) => set('rollNumber', e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Father's Name
            </label>
            <input
              type="text"
              value={form.fatherName}
              onChange={(e) => set('fatherName', e.target.value)}
              placeholder="Guardian name"
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Contact Number
            </label>
            <input
              type="tel"
              value={form.contactNo}
              onChange={(e) => set('contactNo', e.target.value)}
              placeholder="Mobile number"
              className="w-full rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant/30 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
