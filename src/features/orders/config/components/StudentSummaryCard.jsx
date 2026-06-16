import { useState } from 'react'

export default function StudentSummaryCard({ studentData, onRemove, onEdit }) {
  const { student, selectedClass, selectedSection, totals, orderItems = [] } = studentData
  const [expanded, setExpanded] = useState(false)

  const classLabel = selectedClass?.name ?? selectedClass?.label ?? '—'
  const sectionLabel = selectedSection?.name ?? selectedSection?.section ?? '—'

  return (
    <div className="mb-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden">
      {/* Header row — always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
          {student.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-on-surface">{student.name}</p>
          <p className="text-xs text-on-surface-variant">
            {classLabel} · {sectionLabel} · ₹{Number(totals?.total ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          className="shrink-0 rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${student.name}`}
          className="shrink-0 rounded-lg p-1.5 text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Expandable detail panel */}
      {expanded && (
        <div className="border-t border-outline-variant/10 bg-surface-container-low/40 px-4 pb-3 pt-2">
          {orderItems.length > 0 ? (
            <div className="space-y-1">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-on-surface-variant">
                  <span className="truncate pr-3">{item.label}</span>
                  <span className="shrink-0 font-medium text-on-surface">
                    ₹{(Number(item.unitPrice) * Number(item.quantity ?? 1)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-outline-variant/20 pt-1.5 text-xs font-semibold text-on-surface">
                <span>Total</span>
                <span className="text-primary">₹{Number(totals?.total ?? 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">No items configured.</p>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit order
          </button>
        </div>
      )}
    </div>
  )
}
