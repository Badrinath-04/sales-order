export default function Topbar() {
  return (
    <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between bg-[#fbf9f8]/80 px-8 backdrop-blur-md dark:bg-slate-950/80">
      <div className="max-w-md flex-grow">
        <div className="group relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline"
            data-icon="search"
            aria-hidden
          >
            search
          </span>
          <input
            className="w-full rounded-xl border-none bg-surface-container-highest py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary"
            placeholder="Search orders or students..."
            type="search"
            name="admin-search"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 text-primary dark:text-primary-container">
        <button
          type="button"
          className="relative rounded-full p-2 transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined" data-icon="account_circle" aria-hidden>
            account_circle
          </span>
        </button>
      </div>
    </header>
  )
}
