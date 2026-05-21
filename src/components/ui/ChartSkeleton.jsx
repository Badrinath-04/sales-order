/** Chart area placeholder while report trend data loads. */
export default function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 h-4 w-40 rounded bg-surface-container-high" />
      <div className="flex h-48 items-end gap-2">
        {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-surface-container-high"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}
