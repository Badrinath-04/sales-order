import { useCallback, useMemo, useState } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { branchesApi, transactionsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import { ROLES } from '@/config/navigation'
import BranchCampusSelect from './components/BranchCampusSelect'
import FiltersBar from './components/FiltersBar'
import { getTransactionDateRange, periodKpiLabels } from './transactionDateRange'
import TransactionsTable from './components/TransactionsTable'
import TrendInsightCard from './components/TrendInsightCard'

function formatCurrency(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const INITIALS_CLASSES = [
  'bg-primary-fixed text-primary',
  'bg-tertiary-fixed text-tertiary',
  'bg-secondary-container text-on-secondary-container',
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-outline-variant text-on-surface',
]

function mapTransactionToRow(tx, idx) {
  const order = tx.order ?? {}
  const student = order.student ?? {}
  const studentClass = student.class?.label
    ? `${student.class.label}${student.class.section ? `-${student.class.section}` : ''}`
    : (student.rollNumber ? `Roll ${student.rollNumber}` : '—')
  const orderNotes = (order.notes && String(order.notes).trim()) || ''
  const txNotes = (tx.notes && String(tx.notes).trim()) || ''
  const remarksFull = orderNotes || txNotes
  const remarks =
    remarksFull.length > 40 ? `${remarksFull.slice(0, 40)}…` : remarksFull
  return {
    id: order.id ?? tx.id,
    orderId: order.orderId ?? tx.id,
    date: formatDate(tx.paidAt ?? tx.createdAt),
    orderedLine: `Ordered on ${new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    studentName: student.name ?? 'Unknown',
    initials: student.initials ?? '??',
    initialsClass: INITIALS_CLASSES[idx % INITIALS_CLASSES.length],
    classLabel: studentClass,
    kitType: tx.paymentMethod ?? '—',
    amount: Number(tx.amount),
    status: tx.paymentMethod === 'CREDIT'
      ? 'Credit'
      : tx.status === 'PAID'
        ? 'Paid'
        : tx.status === 'PARTIAL'
          ? 'Partial'
          : 'Pending',
    remarks,
    remarksFull,
    orderNotes,
  }
}

export default function Transactions() {
  const { branchId, role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const initialTab = location.state?.activeTab === 'dues' ? 'dues' : 'transactions'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [filters, setFilters] = useState({
    search: '',
    date: '7d',
    class: '',
    status: '',
    method: '',
    dueSort: 'desc',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    date: '7d',
    class: '',
    status: '',
    method: '',
    dueSort: 'desc',
  })
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(branchId || 'all')

  const handleBranchChange = useCallback((branch) => {
    setSelectedBranchFilter(branch)
    setFilters((prev) => ({ ...prev, class: '' }))
    setAppliedFilters((prev) => ({ ...prev, class: '' }))
  }, [])

  const updateFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
    if (key !== 'search') {
      setAppliedFilters((prev) => ({ ...prev, [key]: val }))
    }
  }
  const clearFilters = () => {
    const reset = { search: '', date: '7d', class: '', status: '', method: '', dueSort: 'desc' }
    setFilters(reset)
    setAppliedFilters(reset)
    if (isSuperAdmin) setSelectedBranchFilter('all')
  }

  const fetchBranches = useCallback(
    () => (isSuperAdmin ? branchesApi.list() : null),
    [isSuperAdmin],
  )
  const { data: branchesData } = useApi(fetchBranches, null, [isSuperAdmin])
  const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])

  const dateRange = useMemo(
    () => getTransactionDateRange(appliedFilters.date),
    [appliedFilters.date],
  )

  const effectiveBranchId = isSuperAdmin
    ? (selectedBranchFilter === 'all' ? undefined : selectedBranchFilter)
    : branchId

  const kpiParams = useMemo(
    () => ({
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      ...dateRange,
      ...(appliedFilters.class ? { classGrade: appliedFilters.class } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.method ? { paymentMethod: appliedFilters.method } : {}),
    }),
    [effectiveBranchId, appliedFilters.class, appliedFilters.status, appliedFilters.method, dateRange],
  )
  const kpiDepsKey = `${effectiveBranchId ?? 'all'}|${appliedFilters.class}|${appliedFilters.status}|${appliedFilters.method}|${dateRange.dateFrom ?? ''}|${dateRange.dateTo ?? ''}`

  const fetchKpis = useCallback((params) => transactionsApi.getKpis(params ?? {}), [])
  const { data: kpisData, loading: kpisLoading } = useApi(fetchKpis, kpiParams, [kpiDepsKey])

  const periodLabels = useMemo(
    () => periodKpiLabels(appliedFilters.date),
    [appliedFilters.date],
  )

  const txListParams = useMemo(
    () => ({
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      limit: 100,
      ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
      ...(appliedFilters.class ? { classGrade: appliedFilters.class } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.method ? { paymentMethod: appliedFilters.method } : {}),
      ...dateRange,
    }),
    [effectiveBranchId, appliedFilters, dateRange],
  )
  const txListDepsKey = `${effectiveBranchId ?? 'all'}|${appliedFilters.search}|${appliedFilters.class}|${appliedFilters.status}|${appliedFilters.method}|${appliedFilters.date}|${dateRange.dateFrom ?? ''}|${dateRange.dateTo ?? ''}`

  const fetchTransactions = useCallback((params) => transactionsApi.list(params ?? {}), [])
  const { data: txData, loading: txLoading } = useApi(fetchTransactions, txListParams, [txListDepsKey])

  const dueListParams = useMemo(
    () => ({
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      limit: 100,
      ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
      ...(appliedFilters.class ? { classGrade: appliedFilters.class } : {}),
      ...(appliedFilters.status ? { paymentStatus: appliedFilters.status } : {}),
      ...(appliedFilters.method ? { paymentMethod: appliedFilters.method } : {}),
      ...dateRange,
    }),
    [effectiveBranchId, appliedFilters, dateRange],
  )
  const dueListDepsKey = txListDepsKey

  const fetchDueOrders = useCallback((params) => transactionsApi.getDues(params ?? {}), [])
  const { data: dueData, loading: dueLoading } = useApi(fetchDueOrders, dueListParams, [dueListDepsKey])

  const revenueToday = kpisData?.revenueToday ?? 0
  const ordersToday = kpisData?.ordersToday ?? 0

  const rawRows = Array.isArray(txData) ? txData : (txData?.data ?? [])
  const transactionsRows = rawRows.map((tx, i) => mapTransactionToRow(tx, i))
  const dueOrders = (Array.isArray(dueData) ? dueData : (dueData?.data ?? []))
    .map((order) => ({
      id: order.id,
      orderId: order.orderId,
      date: formatDate(order.createdAt),
      studentId: order.student?.id ?? null,
      studentName: order.student?.name ?? 'Unknown',
      studentRoll: order.student?.rollNumber ?? '',
      guardianName: order.student?.guardianName ?? 'N/A',
      guardianPhone: order.student?.guardianPhone ?? '',
      total: Number(order.totalAmount ?? order.total ?? 0),
      paid: Number(order.paidAmount ?? 0),
      due: Math.max(0, Number(order.dueAmount ?? 0)),
      paymentStatus: order.paymentStatus,
      branchName: order.branch?.name ?? 'Unknown',
      branchId: order.branch?.id ?? null,
      classId: order.student?.class?.id ?? null,
      classGrade: Number(order.student?.class?.grade ?? 0),
      className: order.student?.class?.label ?? 'Class',
      sectionName: `Section ${order.student?.class?.section ?? ''}`.trim(),
      sectionCode: order.student?.class?.section ?? '',
      classLabel: order.student?.class?.label
        ? `${order.student.class.label}${order.student.class.section ? `-${order.student.class.section}` : ''}`
        : '—',
    }))
    .filter((o) => o.due > 0)
    .sort((a, b) => {
      const asc = appliedFilters.dueSort === 'asc'
      return asc ? a.due - b.due : b.due - a.due
    })

  const downloadDueCsv = useCallback(() => {
    if (!dueOrders.length) return
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const headers = ['Order ID', 'Student Name', 'Class', 'Branch', 'Payment Status', 'Total', 'Paid', 'Due']
    const rows = dueOrders.map((row) => [
      row.orderId,
      row.studentName,
      row.classLabel,
      row.branchName,
      row.paymentStatus,
      row.total.toFixed(2),
      row.paid.toFixed(2),
      row.due.toFixed(2),
    ])
    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `due-list-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [dueOrders])

  return (
    <div className="relative pb-28">
      <div className="mb-6 md:mb-10 flex flex-col justify-between gap-4 md:gap-6 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-4 md:gap-8">
            <div className="min-w-0">
              <h1 className="headline text-2xl md:text-4xl font-extrabold tracking-tight text-on-surface">
                Recent Transactions
              </h1>
              <p className="mt-0.5 font-body text-sm font-medium leading-snug text-on-surface-variant md:text-base">
                Overview of kits distribution and fee collections.
              </p>
            </div>
            {isSuperAdmin ? (
              <BranchCampusSelect
                branches={branches}
                value={selectedBranchFilter}
                onChange={handleBranchChange}
                className="mt-2 w-full sm:ml-10 sm:mt-3 sm:w-64 md:ml-14"
              />
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 md:p-6 shadow-sm">
              <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">
                {periodLabels.revenue}
              </p>
              <p className="font-headline text-xl md:text-2xl font-bold text-primary">
                {kpisLoading ? '…' : formatCurrency(revenueToday)}
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 md:p-6 shadow-sm">
              <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">
                {periodLabels.orders}
              </p>
              <p className="font-headline text-xl md:text-2xl font-bold text-tertiary">
                {kpisLoading ? '…' : `${ordersToday} ${ordersToday === 1 ? 'payment' : 'payments'}`}
              </p>
            </div>
          </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${activeTab === 'transactions' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}
        >
          Transactions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dues')}
          className={`rounded-full px-4 py-2 text-sm font-bold ${activeTab === 'dues' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}
        >
          Due List
        </button>
      </div>

      <FiltersBar
        mode={activeTab === 'dues' ? 'dues' : 'transactions'}
        catalogBranchId={isSuperAdmin ? (selectedBranchFilter === 'all' ? undefined : selectedBranchFilter) : branchId}
        filters={filters}
        onChange={updateFilter}
        onApply={() => setAppliedFilters(filters)}
        onClear={clearFilters}
      />

      {activeTab === 'transactions' ? (
        <>
          {txLoading ? (
            <p className="py-8 text-sm text-on-surface-variant">Loading transactions…</p>
          ) : (
            <TransactionsTable rows={transactionsRows} total={rawRows.length} />
          )}
        </>
      ) : (
        <div className="mt-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-headline text-lg font-bold text-on-surface">Due Students</h3>
            <button
              type="button"
              onClick={downloadDueCsv}
              disabled={!dueOrders.length}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
          {dueLoading ? (
            <p className="text-sm text-on-surface-variant">Loading due list…</p>
          ) : dueOrders.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No pending dues.</p>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="md:hidden space-y-3">
                {dueOrders.map((row) => (
                  <div key={row.id} className="rounded-xl border border-outline-variant/10 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">{row.studentName}</p>
                        <p className="text-xs text-on-surface-variant">{row.orderId} · {row.classLabel}</p>
                        <p className="text-xs text-on-surface-variant">{row.date}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {row.paid <= 0 ? `Credit Order: ${formatCurrency(row.due)}` : (row.paymentStatus === 'PARTIAL' ? 'Partial / Due' : 'Due')}
                      </span>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total</p>
                        <p className="text-sm font-semibold text-on-surface">{formatCurrency(row.total)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Paid</p>
                        <p className="text-sm font-semibold text-on-surface">{formatCurrency(row.paid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Due</p>
                        <p className="text-sm font-bold text-error">{formatCurrency(row.due)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(paths.transactionDetail(row.id))}
                        className="flex-1 rounded-xl border border-outline-variant/30 py-2.5 text-xs font-semibold hover:bg-surface-container-low"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(paths.ordersPayment, {
                          state: {
                            selectedStudents: [{ id: row.studentId, name: row.studentName, roll: row.studentRoll, guardian: row.guardianName, parentPhone: row.guardianPhone }],
                            selectedClass: { id: row.classGrade, name: row.className },
                            selectedSection: { id: row.classId, name: row.sectionName, section: row.sectionCode },
                            branchId: row.branchId,
                            existingOrderId: row.id,
                            existingOrderNumber: row.orderId,
                            dueAmount: row.due,
                            totalAmount: row.total,
                            paidAmount: row.paid,
                          },
                        })}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary hover:opacity-90"
                      >
                        Clear Due
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Student Name</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Class & Section</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Amount</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Paid Amount</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Due Amount</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Payment Status</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {dueOrders.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-container-low/60">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-on-surface">{row.studentName}</p>
                          <p className="text-xs text-on-surface-variant">{row.orderId}</p>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{row.classLabel}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(row.total)}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(row.paid)}</td>
                        <td className="px-4 py-3 font-bold text-error">{formatCurrency(row.due)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {row.paid <= 0 ? `Credit Order: ${formatCurrency(row.due)}` : (row.paymentStatus === 'PARTIAL' ? 'Partial / Due' : 'Due')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{row.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(paths.transactionDetail(row.id))}
                              className="rounded-lg border border-outline-variant/30 px-2.5 py-1 text-xs font-semibold hover:bg-surface-container-low"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(paths.ordersPayment, {
                                state: {
                                  selectedStudents: [{ id: row.studentId, name: row.studentName, roll: row.studentRoll, guardian: row.guardianName, parentPhone: row.guardianPhone }],
                                  selectedClass: { id: row.classGrade, name: row.className },
                                  selectedSection: { id: row.classId, name: row.sectionName, section: row.sectionCode },
                                  branchId: row.branchId,
                                  existingOrderId: row.id,
                                  existingOrderNumber: row.orderId,
                                  dueAmount: row.due,
                                  totalAmount: row.total,
                                  paidAmount: row.paid,
                                },
                              })}
                              className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-on-primary hover:opacity-90"
                            >
                              Clear Due
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      <TrendInsightCard />
    </div>
  )
}
