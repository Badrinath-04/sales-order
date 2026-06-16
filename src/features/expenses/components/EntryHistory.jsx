import { useCallback, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { useApi } from '@/hooks/useApi'
import { ROLES } from '@/config/navigation'
import { branchesApi } from '@/services/api'
import { expenseApi } from '../expenseApi'
import {
  ENTRY_TYPE_LABELS, ENTRY_TYPE_COLORS, EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS, formatCurrency,
} from '../expenseConstants'

const IST = { timeZone: 'Asia/Kolkata' }

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...IST })
}

function fmtTime(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...IST })
}

function fmtDateTime(isoStr) {
  if (!isoStr) return { date: '—', time: '' }
  const d = new Date(isoStr)
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...IST }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...IST }),
  }
}

function EntryTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-label ${ENTRY_TYPE_COLORS[type] ?? 'text-on-surface bg-surface-container-low'}`}>
      {ENTRY_TYPE_LABELS[type] ?? type}
    </span>
  )
}

function BalanceRow({ label, value, icon, positive, negative, bold, muted, divider }) {
  return (
    <>
      {divider && <div className="border-t border-outline-variant/20 my-2" />}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${muted ? 'text-on-surface-variant' : positive ? 'text-primary' : negative ? 'text-error' : 'text-on-surface'}`}>
            {icon}
          </span>
          <span className={`font-body text-sm ${bold ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
        </div>
        <span className={`font-headline text-sm font-semibold ${negative ? 'text-error' : positive ? 'text-primary' : 'text-on-surface'}`}>
          {negative ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
        </span>
      </div>
    </>
  )
}

function PositionCard({ pos }) {
  const [showMethods, setShowMethods] = useState(false)

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-outline-variant/10">
        <p className="font-headline text-sm font-semibold text-on-surface">Daily Cash Position</p>
        <p className="text-xs text-on-surface-variant font-body">{pos.branch?.name}</p>
      </div>
      <div className="px-4 py-3 space-y-0.5">
        <BalanceRow label="Opening Balance"  value={pos.openingBalance}  icon="account_balance_wallet" muted />
        <BalanceRow label="Cash Collected"   value={pos.cashCollected}   icon="payments"              positive />
        <div>
          <div
            onClick={() => setShowMethods((v) => !v)}
            className="flex items-center justify-between py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">phone_android</span>
              <span className="font-body text-sm text-on-surface-variant">Online Collected</span>
              {pos.onlineByMethod?.length > 0 && (
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  {showMethods ? 'expand_less' : 'expand_more'}
                </span>
              )}
            </div>
            <span className="font-headline text-sm font-semibold text-primary">{formatCurrency(pos.onlineCollected)}</span>
          </div>
          {showMethods && pos.onlineByMethod?.length > 0 && (
            <div className="ml-6 mb-1 space-y-0.5">
              {pos.onlineByMethod.map((m) => (
                <div key={m.paymentMethod} className="flex justify-between text-xs text-on-surface-variant font-body">
                  <span>{PAYMENT_METHOD_LABELS[m.paymentMethod] ?? m.paymentMethod}</span>
                  <span>{formatCurrency(m.amount ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <BalanceRow label="Total Available"  value={pos.totalAvailable}  icon="calculate"             bold divider />
        <BalanceRow label="Handovers"        value={-pos.handovers}      icon="arrow_upward"          negative />
        <BalanceRow label="Expenses"         value={-pos.expenses}       icon="receipt_long"          negative />
      </div>
      <div className={`mx-3 mb-3 rounded-xl px-4 py-3 flex items-center justify-between ${pos.isNegative ? 'bg-error-container' : 'bg-primary/10'}`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${pos.isNegative ? 'text-error' : 'text-primary'}`}>
            {pos.isNegative ? 'warning' : 'check_circle'}
          </span>
          <span className={`font-body text-sm font-semibold ${pos.isNegative ? 'text-error' : 'text-primary'}`}>Closing Balance</span>
        </div>
        <span className={`font-headline text-base font-bold ${pos.isNegative ? 'text-error' : 'text-primary'}`}>
          {formatCurrency(pos.closingBalance)}
        </span>
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  APPROVED: { label: 'Approved', cls: 'bg-primary/10 text-primary',       icon: 'check_circle' },
  PENDING:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700',       icon: 'schedule' },
  REJECTED: { label: 'Rejected', cls: 'bg-error-container text-error',     icon: 'cancel' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold font-label ${cfg.cls}`}>
      <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function ManualEntriesTable({ entries, isSuperAdmin, onStatusChange }) {
  const [actioningId, setActioningId] = useState(null)

  async function handleStatus(id, status) {
    setActioningId(id)
    try {
      await expenseApi.updateEntryStatus(id, status)
      onStatusChange?.()
    } catch (e) {
      console.error('Status update failed', e)
    } finally {
      setActioningId(null)
    }
  }

  const pendingCount = entries.filter((e) => e.status === 'PENDING').length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-headline text-sm font-semibold text-on-surface">
          Manual Entries — All Time
          <span className="ml-2 font-body text-xs font-normal text-on-surface-variant">({entries.length} entries)</span>
        </h3>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 font-label">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {pendingCount} pending approval
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">edit_note</span>
          <p className="mt-1 text-sm text-on-surface-variant font-body">No manual entries recorded</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Recorded</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Type</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Details</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Method</th>
                <th className="px-4 py-2.5 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Status</th>
                <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">By</th>
                {isSuperAdmin && (
                  <th className="px-4 py-2.5 text-center font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {entries.map((entry) => {
                const recorded = fmtDateTime(entry.createdAt)
                const isPending = entry.status === 'PENDING'
                const actioning = actioningId === entry.id
                return (
                  <tr key={entry.id} className={`transition-colors ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-surface-container-low/50'}`}>
                    <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs whitespace-nowrap">
                      <div className="font-medium text-on-surface">{recorded.date}</div>
                      <div>{recorded.time} IST</div>
                    </td>
                    <td className="px-4 py-2.5"><EntryTypeBadge type={entry.entryType} /></td>
                    <td className="px-4 py-2.5 text-on-surface font-body text-xs max-w-[160px] truncate">
                      {entry.entryType === 'HANDOVER'
                        ? (entry.recipient ?? '—')
                        : entry.entryType === 'EXPENSE'
                          ? (EXPENSE_CATEGORY_LABELS[entry.category] ?? entry.category ?? '—')
                          : (entry.description ?? 'Online')}
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs">
                      {PAYMENT_METHOD_LABELS[entry.paymentMethod] ?? entry.paymentMethod}
                    </td>
                    <td className="px-4 py-2.5 text-right font-headline font-semibold text-on-surface">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={entry.status} /></td>
                    <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs whitespace-nowrap">
                      {entry.createdBy?.displayName ?? '—'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-2.5 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              disabled={actioning}
                              onClick={() => handleStatus(entry.id, 'APPROVED')}
                              className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary font-body hover:bg-primary/20 disabled:opacity-50 transition-colors"
                            >
                              {actioning ? '…' : 'Approve'}
                            </button>
                            <button
                              disabled={actioning}
                              onClick={() => handleStatus(entry.id, 'REJECTED')}
                              className="rounded-lg bg-error-container px-2.5 py-1 text-xs font-semibold text-error font-body hover:bg-error/20 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-body">
                            {entry.approvedBy?.displayName ?? '—'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputCls = 'rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-body focus:border-primary focus:outline-none'

export default function EntryHistory({ branchId: propBranchId }) {
  const { branchId: sessionBranchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  const [date, setDate] = useState(todayLocal)
  const [selectedBranchId, setSelectedBranchId] = useState('')

  const activeBranchId = isSuperAdmin ? (propBranchId || selectedBranchId) : sessionBranchId

  const fetchBranches = useCallback(
    () => isSuperAdmin ? branchesApi.list({ type: 'BRANCH' }) : null,
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = Array.isArray(branchesData) ? branchesData : []

  const fetchPosition = useCallback(() => {
    if (!activeBranchId) return null
    return expenseApi.getDailyPosition({ branchId: activeBranchId, date })
  }, [activeBranchId, date])

  // All manual entries (not date-filtered) — shown in the entries table
  const fetchEntries = useCallback(() => {
    if (!activeBranchId) return null
    return expenseApi.listEntries({ branchId: activeBranchId, limit: 500 })
  }, [activeBranchId])

  const { data: pos, loading, error } = useApi(fetchPosition, null, [fetchPosition])
  const { data: entriesData, refetch: refetchEntries } = useApi(fetchEntries, null, [fetchEntries])

  const transactions = Array.isArray(pos?.transactions) ? pos.transactions : []
  const entries = Array.isArray(entriesData) ? entriesData : []

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_today</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
        {isSuperAdmin && !propBranchId && branches.length > 0 && (
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={`${inputCls} min-w-[160px]`}
          >
            <option value="">Select Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Branch prompt */}
      {isSuperAdmin && !activeBranchId && (
        <div className="rounded-2xl border border-outline-variant/30 border-dashed bg-surface-container-lowest p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">corporate_fare</span>
          <p className="mt-2 font-body text-sm font-semibold text-on-surface">Select a branch to view history</p>
        </div>
      )}

      {loading && activeBranchId && (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-error-container px-4 py-3 text-sm text-error font-body">{error}</div>
      )}

      {pos && !loading && (
        <>
          {/* Position Card */}
          <PositionCard pos={pos} />

          {/* Transactions from Transaction table */}
          <div>
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-2">
              Fee Collections — {fmtDate(pos.date)}
              <span className="ml-2 font-body text-xs font-normal text-on-surface-variant">({transactions.length} transactions)</span>
            </h3>
            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">receipt</span>
                <p className="mt-1 text-sm text-on-surface-variant font-body">No fee collections on this date</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                      <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Time</th>
                      <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Student / Order</th>
                      <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Method</th>
                      <th className="px-4 py-2.5 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Status</th>
                      <th className="px-4 py-2.5 text-right font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs whitespace-nowrap">
                          {(() => { const dt = fmtDateTime(tx.paidAt); return <><div>{dt.date}</div><div>{dt.time}</div></> })()}
                        </td>
                        <td className="px-4 py-2.5 text-on-surface font-body">
                          <div className="font-semibold text-xs">{tx.order?.student?.name ?? '—'}</div>
                          <div className="text-xs text-on-surface-variant">{tx.id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="px-4 py-2.5 text-on-surface-variant font-body text-xs">
                          {PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-label ${tx.status === 'PAID' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-headline font-semibold text-on-surface">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manual Entries (handovers + expenses) — all time */}
          <ManualEntriesTable entries={entries} isSuperAdmin={isSuperAdmin} onStatusChange={refetchEntries} />
        </>
      )}
    </div>
  )
}
