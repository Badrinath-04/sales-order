import { rosterDefaults } from '../../data'

export default function HeaderStats({ contextTitle, roster: rosterProp, onOpenAddStudent }) {
  const roster = { ...rosterDefaults, ...(rosterProp ?? {}) }
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-headline text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {contextTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-6">
          <div className="hidden items-center gap-1 text-sm font-medium text-slate-500 lg:flex">
            <span>Academic Year 2024-25</span>
          </div>
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>person_add</span>
            Add Student
          </button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm md:col-span-2">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-primary">
              Roster Overview
            </span>
            <h2 className="font-headline text-[2rem] font-extrabold text-on-surface">Student Distribution</h2>
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
          <p className="text-[13px] opacity-90">Pending Payments</p>
        </div>
      </div>
    </>
  )
}
