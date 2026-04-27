import { useCallback, useState } from 'react'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const TYPE_META = {
  INCOMING:      { label: 'Stock Added',       icon: 'add_circle',      color: 'text-green-700 bg-green-50' },
  OUTGOING:      { label: 'Distributed',       icon: 'remove_circle',   color: 'text-error bg-error-container/40' },
  ADJUSTMENT:    { label: 'Stock Adjusted',    icon: 'edit_square',     color: 'text-primary bg-primary/10' },
  TRANSFER_IN:   { label: 'Transfer In',       icon: 'move_item',       color: 'text-secondary bg-secondary-container/40' },
  TRANSFER_OUT:  { label: 'Transfer Out',      icon: 'outbox',          color: 'text-outline bg-surface-container-low' },
}

function formatDelta(delta, changeType) {
  const sign = changeType === 'OUTGOING' || changeType === 'TRANSFER_OUT' ? '-' : '+'
  return `${sign}${Math.abs(delta)}`
}

function deltaColor(changeType) {
  return changeType === 'OUTGOING' || changeType === 'TRANSFER_OUT' ? 'text-error font-bold' : 'text-green-700 font-bold'
}

export default function StockLogDrawer({ branchId, itemType, itemId, onClose }) {
  const [typeFilter, setTypeFilter] = useState('ALL')

  const fetchLogs = useCallback(
    () => inventoryApi.getLogs({ branchId, itemType, itemId, limit: 100 }),
    [branchId, itemType, itemId],
  )
  const { data: logsData, loading } = useApi(fetchLogs, null, [branchId, itemType, itemId])
  const allLogs = Array.isArray(logsData) ? logsData : (logsData?.data ?? [])

  const logs = typeFilter === 'ALL'
    ? allLogs
    : allLogs.filter((l) => l.changeType === typeFilter)

  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Qty Change', 'Before', 'After', 'Item', 'Performed By', 'Notes']
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      TYPE_META[l.changeType]?.label ?? l.changeType,
      formatDelta(l.quantityDelta, l.changeType),
      l.quantityBefore,
      l.quantityAfter,
      l.bookItem?.label ?? l.uniformSize?.name ?? l.accessory?.name ?? '—',
      l.performedBy?.displayName ?? '—',
      l.notes ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `stock_log_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface">Stock Audit Log</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">Full history of all stock movements</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-outline-variant/20 px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-base" aria-hidden>download</span>
              Export CSV
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-container-low">
              <span className="material-symbols-outlined" aria-hidden>close</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-outline-variant/10 p-4">
          {['ALL', 'INCOMING', 'OUTGOING', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                typeFilter === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {t === 'ALL' ? 'All' : (TYPE_META[t]?.label ?? t)}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <p className="text-sm text-on-surface-variant">Loading logs…</p>}
          {!loading && logs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-outline" aria-hidden>history</span>
              <p className="text-sm text-on-surface-variant">No log entries found.</p>
            </div>
          )}
          <div className="relative space-y-0">
            {logs.map((log, idx) => {
              const meta = TYPE_META[log.changeType] ?? { label: log.changeType, icon: 'info', color: 'text-outline bg-surface-container-low' }
              const itemLabel = log.bookItem?.label ?? log.uniformSize?.name ?? log.accessory?.name ?? '—'
              return (
                <div key={log.id} className="relative flex gap-4 pb-6">
                  {/* Timeline line */}
                  {idx < logs.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-outline-variant/20" />
                  )}
                  {/* Icon */}
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                    <span className="material-symbols-outlined text-lg" aria-hidden>{meta.icon}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{meta.label}</p>
                        <p className="text-xs text-on-surface-variant">{itemLabel}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base ${deltaColor(log.changeType)}`}>
                          {formatDelta(log.quantityDelta, log.changeType)}
                        </p>
                        <p className="text-xs text-on-surface-variant">→ {log.quantityAfter} units</p>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="mt-1 text-xs italic text-on-surface-variant">"{log.notes}"</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-outline">
                      <span>{new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {log.performedBy?.displayName && <span>by {log.performedBy.displayName}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
