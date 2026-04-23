import { booksKpiRow } from '../data'

export default function KPISection({ activeTab, setActiveTab }) {
  if (activeTab !== 'books' && activeTab !== 'uniforms') {
    return null
  }

  return (
    <div className="mb-10 flex gap-6">
      {booksKpiRow.map((card) => {
        const isActive = activeTab === card.id

        if (isActive) {
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveTab(card.id)}
              className="flex flex-1 transform text-left text-white shadow-xl transition-all scale-[1.02] rounded-xl bg-primary-container bg-gradient-to-br from-primary to-primary-container p-6"
            >
              <div className="flex w-full flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-white/20 p-2">
                    <span className="material-symbols-outlined text-white" aria-hidden>
                      {card.icon}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-headline text-lg font-bold opacity-90">{card.title}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{card.value}</span>
                  <span className="text-xs font-medium opacity-75">{card.subtitle}</span>
                </div>
              </div>
            </button>
          )
        }

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveTab(card.id)}
            className="group flex flex-1 transform text-left transition-all hover:shadow-md rounded-xl bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="flex w-full flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-secondary-container p-2 transition-colors group-hover:bg-primary-fixed">
                  <span className="material-symbols-outlined text-primary" aria-hidden>
                    {card.icon}
                  </span>
                </div>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface-variant">{card.title}</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-surface">{card.value}</span>
                <span className="text-xs font-medium text-stone-400">{card.subtitle}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
