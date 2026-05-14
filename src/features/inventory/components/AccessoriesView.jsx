import { useCallback } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

export default function AccessoriesView() {
  const { branchId } = useAdminSession()

  const fetchAccessories = useCallback(
    () => inventoryApi.listAccessories({ branchId }),
    [branchId],
  )
  const { data: groups, loading } = useApi(fetchAccessories, null, [branchId])

  const groupList = groups ?? []

  function countForGroup(group) {
    const total = group.accessories?.reduce((sum, acc) => {
      const stock = acc.accessoryStocks?.find((s) => !branchId || s.branchId === branchId)
      return sum + (stock?.quantity ?? 0)
    }, 0) ?? 0
    return `${total.toLocaleString('en-US')} Units`
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-1">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
          Accessories Inventory
        </h2>
        <p className="text-sm text-on-surface-variant">
          Track add-ons, lab gear, and optional items in one consolidated workspace.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading accessories…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {groupList.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined" data-icon={group.icon} aria-hidden>
                  {group.icon}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {group.label}
                </p>
                <p className="font-headline text-lg font-bold text-on-surface">{countForGroup(group)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
