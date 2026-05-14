const TAB_ITEMS = [
  { id: 'books', label: 'Books' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'accessories', label: 'Accessories' },
]

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <nav className="hidden h-full items-center gap-6 md:flex">
      {TAB_ITEMS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              isActive
                ? "border-b-2 border-blue-700 pb-1 font-['Manrope'] text-lg font-semibold text-blue-700 dark:border-blue-400 dark:text-blue-400"
                : "font-['Manrope'] text-lg font-semibold text-stone-500 transition-colors hover:text-blue-600 dark:text-stone-400 dark:hover:text-blue-300"
            }
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
