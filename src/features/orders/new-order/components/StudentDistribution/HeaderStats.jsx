import { rosterDefaults } from '../../data'

export default function HeaderStats({ contextTitle, roster: rosterProp, onOpenAddStudent }) {
  const roster = { ...rosterDefaults, ...(rosterProp ?? {}) }
  return (
    <>
      {/* Title row: class-section name + Add Student inline */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-headline text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {contextTitle}
        </h1>
        <button
          type="button"
          onClick={onOpenAddStudent}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>person_add</span>
          Add Student
        </button>
      </div>

      {/* Stats row: overview card + 2 KPI cards side-by-side */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm md:col-span-2">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-primary">
              Roster Overview
            </span>
            <h2 className="font-headline text-2xl font-extrabold text-on-surface md:text-[2rem]">Student Distribution</h2>
          </div>
          <div className="mt-3 flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
              <span className="text-[13px] font-medium">{roster.totalStudents} Total Students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-tertiary" aria-hidden />
              <span className="text-[13px] font-medium">{roster.unpaidCount} Unpaid</span>
            </div>
          </div>
        </div>
        {/* 2 KPI cards always side-by-side */}
        <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-2">
          <div className="rounded-xl bg-primary-container p-4 text-on-primary-container shadow-sm">
            <span className="material-symbols-outlined mb-1.5 text-2xl" data-icon="package_2" aria-hidden>
              package_2
            </span>
            <h3 className="text-xl font-bold">{roster.kitsDistributedPercent}%</h3>
            <p className="text-[13px] opacity-90">Kits Distributed</p>
          </div>
          <div className="rounded-xl bg-tertiary-fixed p-4 text-on-tertiary-fixed shadow-sm">
            <span className="material-symbols-outlined mb-1.5 text-2xl" data-icon="account_balance_wallet" aria-hidden>
              account_balance_wallet
            </span>
            <h3 className="text-xl font-bold">{roster.pendingPayments}</h3>
            <p className="text-[13px] opacity-90">Pending Students</p>
          </div>
        </div>
      </div>
    </>
  )
}
