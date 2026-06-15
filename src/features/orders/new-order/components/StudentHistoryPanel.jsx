import { useEffect, useState } from 'react'
import { ordersApi } from '@/services/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(n) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function StudentHistoryPanel({ student, onClose, onPlaceNewOrder }) {
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.id) return
    setLoading(true)
    ordersApi
      .getStudentOrders(student.id)
      .then((res) => setOrders(res?.data?.data ?? res?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [student?.id])

  const totalSpent = (orders ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  const categoryDates = {}
  for (const order of [...(orders ?? [])].reverse()) {
    const d = formatDate(order.paidAt ?? order.createdAt)
    const hasBooks = order.items?.some(
      (i) => i.itemType === 'BOOK' && !String(i.label ?? '').toLowerCase().includes('notebook'),
    )
    const hasNotebooks = order.items?.some(
      (i) => i.itemType === 'BOOK' && String(i.label ?? '').toLowerCase().includes('notebook'),
    )
    const hasUniform = order.items?.some((i) => i.itemType === 'UNIFORM')
    if (hasBooks) categoryDates.books = d
    if (hasNotebooks) categoryDates.notebooks = d
    if (hasUniform) categoryDates.uniform = d
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom-sheet on mobile, right slide-in on md+ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl bg-surface shadow-xl md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-full md:w-[420px] md:rounded-none md:rounded-l-2xl md:border-l md:border-outline-variant/20">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-outline-variant/10 p-4">
          <div>
            <p className="font-headline text-base font-bold text-on-surface">Purchase History</p>
            <p className="text-sm text-on-surface-variant">
              {student?.name ?? '—'}{student?.roll ? ` · Roll ${student.roll}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-surface-container-high"
            aria-label="Close history panel"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Loading history…</p>
          ) : !orders?.length ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">No orders yet.</p>
          ) : (
            <>
              {/* Summary card */}
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Summary</p>
                <p className="font-semibold text-on-surface">
                  {orders.length} {orders.length === 1 ? 'visit' : 'visits'} · Total {formatCurrency(totalSpent)}
                </p>
                <div className="mt-2 space-y-0.5">
                  {categoryDates.books && (
                    <p className="text-xs text-on-surface-variant">Books — {categoryDates.books}</p>
                  )}
                  {categoryDates.notebooks && (
                    <p className="text-xs text-on-surface-variant">Notebooks — {categoryDates.notebooks}</p>
                  )}
                  {categoryDates.uniform && (
                    <p className="text-xs text-on-surface-variant">Uniform — {categoryDates.uniform}</p>
                  )}
                </div>
              </div>

              {/* Order cards — most recent first (API already orders by createdAt desc) */}
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{order.orderId}</p>
                      <p className="text-xs text-on-surface-variant">
                        {formatDate(order.paidAt ?? order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : order.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {order.paymentStatus === 'PAID'
                        ? 'Paid'
                        : order.paymentStatus === 'PARTIAL'
                          ? 'Partial'
                          : 'Unpaid'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {(order.items ?? []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-on-surface-variant">
                        <span className="truncate pr-2">{item.label}</span>
                        <span className="shrink-0 font-medium">
                          {formatCurrency(Number(item.unitPrice) * Number(item.quantity ?? 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-outline-variant/10 pt-2">
                    <span className="text-xs text-on-surface-variant">
                      {[
                        ...new Set(
                          (order.transactions ?? []).map((t) => t.paymentMethod).filter(Boolean),
                        ),
                      ].join(' + ') ||
                        order.paymentMethod ||
                        '—'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer — Place New Order */}
        {onPlaceNewOrder && (
          <div className="shrink-0 border-t border-outline-variant/10 p-4">
            <button
              type="button"
              onClick={() => {
                onClose()
                onPlaceNewOrder()
              }}
              className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary shadow-sm hover:opacity-90"
            >
              Place New Order
            </button>
          </div>
        )}
      </div>
    </>
  )
}
