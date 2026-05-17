import { branchDisplayName } from '@/utils/branchDisplayName'

/**
 * Branch picker for super-admin — matches New Order “Select Branch” styling.
 */
export default function BranchCampusSelect({ branches, value, onChange, className = '' }) {
  return (
    <div className={`w-full sm:w-64 ${className}`}>
      <label
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary"
        htmlFor="transactions-branch-select"
      >
        Select Branch
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-primary"
          aria-hidden
        >
          location_city
        </span>
        <select
          id="transactions-branch-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border-2 border-primary/10 bg-white py-3 pl-10 pr-8 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <option value="all">All campuses</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branchDisplayName(branch)}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary"
          aria-hidden
        >
          expand_more
        </span>
      </div>
    </div>
  )
}
