import { useCallback } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { reportsApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

function formatCount(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US')
}

export default function InventorySnapshot() {
  const { branchId } = useAdminSession()

  const fetchDashboard = useCallback(
    () => reportsApi.adminDashboard({ branchId }),
    [branchId],
  )
  const { data, loading } = useApi(fetchDashboard, null, [branchId])

  const snap = data?.inventorySnapshot ?? {}

  const items = [
    { id: 'tx', label: 'Textbooks', count: `${formatCount(snap.booksStock)} In Stock`, icon: 'auto_stories' },
    { id: 'un', label: 'Uniforms', count: `${formatCount(snap.uniformsStock)} In Stock`, icon: 'checkroom' },
  ]

  return (
    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((snap) => (
        <div key={snap.id} className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
            <span className="material-symbols-outlined" data-icon={snap.icon} aria-hidden>
              {snap.icon}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">{snap.label}</p>
            <p className="text-sm font-bold text-on-surface">{loading ? '…' : snap.count}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
