export default function QuickEnroll() {
  return (
    <div className="w-full md:w-80">
      <label
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary"
        htmlFor="roll-search"
      >
        Quick Enroll
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-primary"
          data-icon="person_search"
          aria-hidden
        >
          person_search
        </span>
        <input
          id="roll-search"
          className="w-full rounded-xl border-2 border-primary/10 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Search Roll Number..."
          type="search"
          name="roll-search"
          autoComplete="off"
        />
      </div>
    </div>
  )
}
