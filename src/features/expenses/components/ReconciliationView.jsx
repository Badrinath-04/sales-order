import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { ROLES } from '@/config/navigation'
import { branchesApi } from '@/services/api'
import { expenseApi } from '../expenseApi'
import { PAYMENT_METHOD_LABELS, formatCurrency } from '../expenseConstants'

function fmtDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const inputCls = 'rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-body focus:border-primary focus:outline-none'

function SettlementModal({ method, pendingAmount, branchId, onClose, onSaved }) {
  const [form, setForm] = useState({ amountSettled: String(pendingAmount), utrNumber: '', settlementDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      await expenseApi.createSettlement({
        branchId,
        paymentMethod: method,
        amountSettled: Number(form.amountSettled),
        settlementDate: form.settlementDate,
        utrNumber: form.utrNumber || null,
        notes: form.notes || null,
      })
      onSaved()
    } catch (ex) {
      setErr(ex?.response?.data?.error ?? ex.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-base font-bold text-on-surface">
            Mark Settlement — {PAYMENT_METHOD_LABELS[method] ?? method}
          </h3>
          <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>
        {err && <div className="mb-3 rounded-xl bg-error-container px-3 py-2 text-sm text-error font-body">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-label font-semibold text-on-surface-variant mb-1">Amount Settled (₹)</label>
            <input type="number" step="0.01" required value={form.amountSettled}
              onChange={(e) => setForm((f) => ({ ...f, amountSettled: e.target.value }))}
              className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-label font-semibold text-on-surface-variant mb-1">Settlement Date</label>
            <input type="date" required value={form.settlementDate}
              onChange={(e) => setForm((f) => ({ ...f, settlementDate: e.target.value }))}
              className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-label font-semibold text-on-surface-variant mb-1">UTR / Reference Number</label>
            <input type="text" placeholder="Optional" value={form.utrNumber}
              onChange={(e) => setForm((f) => ({ ...f, utrNumber: e.target.value }))}
              className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="block text-xs font-label font-semibold text-on-surface-variant mb-1">Notes</label>
            <textarea rows={2} placeholder="Optional" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} w-full resize-none`} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-outline-variant/30 py-2.5 text-sm font-semibold text-on-surface font-body hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary font-body hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ReconciliationView({ branchId: propBranchId }) {
  const { branchId: sessionBranchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [settlementModal, setSettlementModal] = useState(null) // { method, pendingAmount }

  const activeBranchId = isSuperAdmin ? (propBranchId || selectedBranchId) : sessionBranchId

  const fetchBranches = useCallback(
    () => isSuperAdmin ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = Array.isArray(branchesData) ? branchesData : []

  const fetchSummary = useCallback(
    () => activeBranchId ? expenseApi.getOnlineSummary({ branchId: activeBranchId }) : null,
    [activeBranchId],
  )
  const fetchSettlements = useCallback(
    () => activeBranchId ? expenseApi.listSettlements({ branchId: activeBranchId }) : null,
    [activeBranchId],
  )

  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useApi(fetchSummary, null, [activeBranchId])
  const { data: settlementsRaw, loading: settlementsLoading, refetch: refetchSettlements } = useApi(fetchSettlements, null, [activeBranchId])

  const rows = Array.isArray(summary?.rows) ? summary.rows : []
  const settlements = Array.isArray(settlementsRaw) ? settlementsRaw : []

  function handleSettlementSaved() {
    setSettlementModal(null)
    refetchSummary()
    refetchSettlements()
  }

  const loading = summaryLoading || settlementsLoading

  return (
    <div className="space-y-6">
      {/* Branch selector for super admin */}
      {isSuperAdmin && !propBranchId && branches.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-base">corporate_fare</span>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={`${inputCls} min-w-[200px]`}
          >
            <option value="">Select Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {isSuperAdmin && !activeBranchId && (
        <div className="rounded-2xl border border-outline-variant/30 border-dashed bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">account_balance</span>
          <p className="mt-2 font-body text-sm font-semibold text-on-surface">Select a branch to view online reconciliation</p>
        </div>
      )}

      {loading && activeBranchId && (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && activeBranchId && (
        <>
          {/* Totals strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Collected', value: summary?.grandTotal ?? 0,   color: 'text-primary',      icon: 'payments' },
              { label: 'Total Settled',   value: summary?.grandSettled ?? 0,  color: 'text-green-600',    icon: 'check_circle' },
              { label: 'Pending',         value: summary?.grandPending ?? 0,  color: 'text-orange-600',   icon: 'pending_actions' },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
                <span className={`material-symbols-outlined text-xl ${k.color}`}>{k.icon}</span>
                <p className="mt-1.5 text-xs font-label font-semibold uppercase tracking-wide text-on-surface-variant">{k.label}</p>
                <p className={`mt-0.5 font-headline text-lg font-bold ${k.color}`}>{formatCurrency(k.value)}</p>
              </div>
            ))}
          </div>

          {/* Per-method table */}
          <div>
            <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Online Methods Breakdown
            </p>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">phone_android</span>
                <p className="mt-1 text-sm text-on-surface-variant font-body">No online transactions recorded</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Method</th>
                      <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Collected</th>
                      <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Settled</th>
                      <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Pending</th>
                      <th className="px-4 py-3 text-center font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {rows.map((row) => (
                      <tr key={row.paymentMethod} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3 font-body text-on-surface font-semibold text-sm">
                          {PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}
                          <span className="ml-1.5 text-xs font-normal text-on-surface-variant">({row.transactionCount} txns)</span>
                        </td>
                        <td className="px-4 py-3 text-right font-headline font-semibold text-on-surface">{formatCurrency(row.totalCollected)}</td>
                        <td className="px-4 py-3 text-right font-headline font-semibold text-green-600">{formatCurrency(row.totalSettled)}</td>
                        <td className="px-4 py-3 text-right font-headline font-semibold">
                          <span className={row.pendingAmount > 0 ? 'text-orange-600' : 'text-on-surface-variant'}>{formatCurrency(row.pendingAmount)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.pendingAmount > 0 && (
                            <button
                              onClick={() => setSettlementModal({ method: row.paymentMethod, pendingAmount: row.pendingAmount })}
                              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary font-body hover:bg-primary/20 transition-colors whitespace-nowrap"
                            >
                              Mark Settled
                            </button>
                          )}
                          {row.pendingAmount <= 0 && (
                            <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Settlement history */}
          {settlements.length > 0 && (
            <div>
              <p className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Settlement History ({settlements.length})
              </p>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Date</th>
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Method</th>
                      <th className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">UTR / Ref</th>
                      <th className="px-4 py-3 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
                      <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant md:table-cell">By</th>
                      <th className="hidden px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant lg:table-cell">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {settlements.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3 text-on-surface-variant font-body text-xs whitespace-nowrap">{fmtDate(s.settlementDate)}</td>
                        <td className="px-4 py-3 font-body text-on-surface text-sm font-semibold">{PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}</td>
                        <td className="px-4 py-3 text-on-surface-variant font-body text-xs font-mono">{s.utrNumber ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-headline font-semibold text-green-600">{formatCurrency(s.amountSettled)}</td>
                        <td className="hidden px-4 py-3 text-on-surface-variant font-body text-xs md:table-cell">{s.settledBy?.displayName ?? '—'}</td>
                        <td className="hidden px-4 py-3 text-on-surface-variant font-body text-xs lg:table-cell max-w-[180px] truncate" title={s.notes ?? ''}>{s.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settlement modal */}
      {settlementModal && activeBranchId && (
        <SettlementModal
          method={settlementModal.method}
          pendingAmount={settlementModal.pendingAmount}
          branchId={activeBranchId}
          onClose={() => setSettlementModal(null)}
          onSaved={handleSettlementSaved}
        />
      )}
    </div>
  )
}
