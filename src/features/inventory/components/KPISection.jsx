import { useCallback } from 'react'
import { useAdminSession } from '@/context/useAdminSession'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

function formatCount(n) {
  return n != null ? Number(n).toLocaleString('en-US') : '…'
}

const KPI_META = {
  books: { title: 'Books Stock', icon: 'menu_book', subtitle: 'units tracked', badge: 'ACTIVE VIEW' },
  uniforms: { title: 'Uniforms Stock', icon: 'apparel', subtitle: 'units tracked', badge: 'ACTIVE VIEW' },
}

export default function KPISection({ activeTab, setActiveTab }) {
  const { branchId } = useAdminSession()

  const fetchKpis = useCallback(
    () => inventoryApi.getKpis({ branchId }),
    [branchId],
  )
  const { data, loading } = useApi(fetchKpis, null, [branchId])

  if (activeTab !== 'books' && activeTab !== 'uniforms') return null

  const cardData = [
    { id: 'books', value: loading ? '…' : formatCount(data?.booksStock) },
    { id: 'uniforms', value: loading ? '…' : formatCount(data?.uniformsStock) },
  ]

  return (
    <div className="mb-10 flex gap-6">
      {cardData.map(({ id, value }) => {
        const meta = KPI_META[id]
        const isActive = activeTab === id

        if (isActive) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="flex flex-1 transform text-left text-white shadow-xl transition-all scale-[1.02] rounded-xl bg-primary-container bg-gradient-to-br from-primary to-primary-container p-6"
            >
              <div className="flex w-full flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-white/20 p-2">
                    <span className="material-symbols-outlined text-white" aria-hidden>
                      {meta.icon}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {meta.badge}
                  </span>
                </div>
                <h3 className="font-headline text-lg font-bold opacity-90">{meta.title}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{value}</span>
                  <span className="text-xs font-medium opacity-75">{meta.subtitle}</span>
                </div>
              </div>
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className="group flex flex-1 transform text-left transition-all hover:shadow-md rounded-xl bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="flex w-full flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-secondary-container p-2 transition-colors group-hover:bg-primary-fixed">
                  <span className="material-symbols-outlined text-primary" aria-hidden>
                    {meta.icon}
                  </span>
                </div>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface-variant">{meta.title}</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-surface">{value}</span>
                <span className="text-xs font-medium text-stone-400">{meta.subtitle}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
