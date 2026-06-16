import { useState, useEffect, useCallback } from 'react'
import { expenseApi } from '../expenseApi'
import {
  ENTRY_TYPES, ENTRY_TYPE_LABELS, EXPENSE_CATEGORIES, PAYMENT_METHODS,
} from '../expenseConstants'
import { usePermission } from '@/hooks/usePermission'
import { useMutation, useApi } from '@/hooks/useApi'

const inputCls =
  'w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm font-body focus:border-primary focus:outline-none'

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant font-label">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error font-body">{error}</p>}
    </div>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

function buildEmptyForm(tab) {
  return {
    amount: '',
    recipient: '',
    category: '',
    description: '',
    paymentMethod: tab === ENTRY_TYPES.ONLINE_ALLOCATION ? 'GPAY' : 'CASH',
    referenceId: '',
    notes: '',
    entryDate: today(),
  }
}

const EXPENSE_PAYMENT_METHODS = PAYMENT_METHODS
const ONLINE_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.value !== 'CASH')

export default function CreateEntryDrawer({
  open,
  onClose,
  branchId,       // null for super admin (no branch in session)
  branches = [],  // list of all branches for super-admin selector
  onCreated,
}) {
  const canHandover = usePermission('canCreateHandoverEntry')
  const canExpense  = usePermission('canCreateExpenseEntry')
  const canOnline   = usePermission('canCreateOnlineAllocation')

  const tabs = [
    canHandover && ENTRY_TYPES.HANDOVER,
    canExpense  && ENTRY_TYPES.EXPENSE,
    canOnline   && ENTRY_TYPES.ONLINE_ALLOCATION,
  ].filter(Boolean)

  const [activeTab, setActiveTab] = useState(null)
  const [form, setForm] = useState(() => buildEmptyForm(tabs[0] ?? ENTRY_TYPES.HANDOVER))
  const [errors, setErrors] = useState({})
  const [recipientIsCustom, setRecipientIsCustom] = useState(false)
  // For super admin: track which branch they've selected inside the drawer
  const [selectedBranchId, setSelectedBranchId] = useState(branchId || '')

  const { mutate, loading, error: apiError } = useMutation(expenseApi.createEntry)

  // Fetch recipients for the currently selected branch
  const fetchRecipients = useCallback(
    () => selectedBranchId ? expenseApi.getRecipients({ branchId: selectedBranchId }) : null,
    [selectedBranchId],
  )
  const { data: recipientsData } = useApi(fetchRecipients, null, [selectedBranchId])
  const recipients = Array.isArray(recipientsData) ? recipientsData : []

  // Set default tab once permissions resolve
  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0])
      setForm(buildEmptyForm(tabs[0]))
    }
  }, [tabs.join(',')]) // eslint-disable-line

  // Sync selectedBranchId if branchId prop changes
  useEffect(() => {
    if (branchId) setSelectedBranchId(branchId)
  }, [branchId])

  if (!open) return null

  const isSuperAdminMode = !branchId && branches.length > 0

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function switchTab(tab) {
    setActiveTab(tab)
    setForm(buildEmptyForm(tab))
    setErrors({})
    setRecipientIsCustom(false)
  }

  function validate() {
    const e = {}
    if (isSuperAdminMode && !selectedBranchId) e.branch = 'Select a branch'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0'
    if (activeTab === ENTRY_TYPES.HANDOVER && !form.recipient) e.recipient = 'Recipient is required'
    if (activeTab === ENTRY_TYPES.EXPENSE && !form.category) e.category = 'Category is required'
    if (activeTab === ENTRY_TYPES.EXPENSE && !form.description?.trim()) e.description = 'Description is required'
    if (activeTab === ENTRY_TYPES.ONLINE_ALLOCATION && !form.description?.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      branchId: selectedBranchId,
      entryType: activeTab,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod || 'CASH',
      recipient: form.recipient || null,
      category: form.category || null,
      description: form.description?.trim() || null,
      referenceId: form.referenceId?.trim() || null,
      notes: form.notes?.trim() || null,
      entryDate: form.entryDate
        ? new Date(form.entryDate).toISOString()
        : new Date().toISOString(),
    }
    try {
      const result = await mutate(payload)
      onCreated?.(result)
      onClose()
    } catch { /* apiError already set */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="font-headline text-xl font-extrabold">New Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-surface-container-low"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </div>

        {/* Tab bar */}
        {tabs.length > 1 && (
          <div className="flex gap-1 border-b border-outline-variant/10 px-6 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={[
                  'rounded-t-lg px-4 py-2 text-sm font-semibold font-label transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {ENTRY_TYPE_LABELS[tab]}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 p-6">

          {/* Branch selector — super admin only */}
          {isSuperAdminMode && (
            <Field label="Branch" error={errors.branch}>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value)
                  setErrors((err) => ({ ...err, branch: undefined }))
                  set('recipient', '') // reset recipient when branch changes
                }}
                className={inputCls}
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Amount */}
          <Field label="Amount (₹)" error={errors.amount}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* Entry Date */}
          <Field label="Entry Date">
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => set('entryDate', e.target.value)}
              className={inputCls}
            />
          </Field>

          {/* HANDOVER-specific: Recipient */}
          {activeTab === ENTRY_TYPES.HANDOVER && (
            <Field label="Recipient" error={errors.recipient}>
              {recipients.length > 0 && !recipientIsCustom ? (
                <select
                  value={form.recipient}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setRecipientIsCustom(true)
                      set('recipient', '')
                    } else {
                      set('recipient', e.target.value)
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">Select recipient…</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                  <option value="__custom__">Other (type a name)…</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter recipient name…"
                    value={form.recipient}
                    onChange={(e) => set('recipient', e.target.value)}
                    className={`${inputCls} flex-1`}
                    autoFocus={recipientIsCustom}
                  />
                  {recipients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setRecipientIsCustom(false); set('recipient', '') }}
                      className="shrink-0 rounded-xl border border-outline-variant/30 px-3 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      Pick list
                    </button>
                  )}
                </div>
              )}
            </Field>
          )}

          {/* HANDOVER: payment method is always CASH — show read-only */}
          {activeTab === ENTRY_TYPES.HANDOVER && (
            <Field label="Payment Method">
              <div className={`${inputCls} cursor-not-allowed bg-surface-container-low text-on-surface-variant`}>
                Cash
              </div>
            </Field>
          )}

          {/* EXPENSE-specific: Category */}
          {activeTab === ENTRY_TYPES.EXPENSE && (
            <Field label="Category" error={errors.category}>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputCls}
              >
                <option value="">Select category…</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          )}

          {/* EXPENSE / ONLINE_ALLOCATION: Description */}
          {(activeTab === ENTRY_TYPES.EXPENSE || activeTab === ENTRY_TYPES.ONLINE_ALLOCATION) && (
            <Field label="Description" error={errors.description}>
              <input
                type="text"
                placeholder="Brief description…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputCls}
              />
            </Field>
          )}

          {/* EXPENSE: Payment Method */}
          {activeTab === ENTRY_TYPES.EXPENSE && (
            <Field label="Payment Method">
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                className={inputCls}
              >
                {EXPENSE_PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Field>
          )}

          {/* ONLINE_ALLOCATION: Payment Method (UPI / BANK_TRANSFER only) */}
          {activeTab === ENTRY_TYPES.ONLINE_ALLOCATION && (
            <Field label="Payment Method">
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                className={inputCls}
              >
                {ONLINE_PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Field>
          )}

          {/* ONLINE_ALLOCATION: Reference ID */}
          {activeTab === ENTRY_TYPES.ONLINE_ALLOCATION && (
            <Field label="Reference / UTR ID (optional)">
              <input
                type="text"
                placeholder="Transaction or UTR reference…"
                value={form.referenceId}
                onChange={(e) => set('referenceId', e.target.value)}
                className={inputCls}
              />
            </Field>
          )}

          {/* Notes (always shown) */}
          <Field label="Notes (optional)">
            <textarea
              rows={3}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex-1" />

          {/* Submit */}
          <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary font-label transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : `Save ${activeTab ? ENTRY_TYPE_LABELS[activeTab] : 'Entry'}`}
            </button>

            {apiError && (
              <p className="text-center text-xs text-error font-body">{apiError}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
