import { rosterDefaults } from '../../data'

export default function HeaderStats({ contextTitle, roster: rosterProp }) {
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
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" data-icon="notifications" aria-hidden>
                notifications
              </span>
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Help"
            >
              <span className="material-symbols-outlined" data-icon="help_outline" aria-hidden>
                help_outline
              </span>
            </button>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-fixed">
              <img
                alt="Administrator Profile"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuASxoogIO4ioIQvQM-GDte7HW4zGfMCS1AI1TZXoEfK16RshKl9beASbDZn308CPGHWnyS5yFDFOaHaMBXV04oFVXafKiP_WoOvCVJkRW7wMlXZcJFbYYC8FMfhYndwIf2fzigIEIJ-PA_3cuiaFcJJvWkJU5P7bgni_ht7_2gZX6hrL0H4zJ6e7tUp3jFSfFIL7Ldm_Ck1hb86XnNCPyZlqNwVEh7A3zJsV3CvVZeR5aevUcvVKhpUgaGC2ohggMiBdMsReGsY7zY"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm md:col-span-2">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-primary">
              Roster Overview
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface">Student Distribution</h2>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" aria-hidden />
              <span className="text-sm font-medium">{roster.totalStudents} Total Students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-tertiary" aria-hidden />
              <span className="text-sm font-medium">{roster.unpaidCount} Unpaid</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-primary-container p-6 text-on-primary-container shadow-sm">
          <span className="material-symbols-outlined mb-2 text-3xl" data-icon="package_2" aria-hidden>
            package_2
          </span>
          <h3 className="text-2xl font-bold">{roster.kitsDistributedPercent}%</h3>
          <p className="text-sm opacity-90">Kits Distributed</p>
        </div>
        <div className="rounded-xl bg-tertiary-fixed p-6 text-on-tertiary-fixed shadow-sm">
          <span className="material-symbols-outlined mb-2 text-3xl" data-icon="account_balance_wallet" aria-hidden>
            account_balance_wallet
          </span>
          <h3 className="text-2xl font-bold">{roster.pendingPayments}</h3>
          <p className="text-sm opacity-90">Pending Payments</p>
        </div>
      </div>
    </>
  )
}
