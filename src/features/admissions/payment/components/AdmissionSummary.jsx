function formatCurrency(value) {
  return `₹${Number(value ?? 0).toFixed(2)}`
}

export default function AdmissionSummary({ admission }) {
  if (!admission) return null

  const rows = [
    { label: 'Admission Code', value: admission.admissionCode },
    { label: 'Parent Name', value: admission.parentName || '—' },
    { label: 'Phone', value: admission.phone },
    { label: 'Class & Section', value: admission.classLabel },
    { label: 'Branch', value: admission.branch?.name || '—' },
  ]

  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-28">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-8">
          <h2 className="mb-5 flex items-center gap-2 font-headline text-lg font-extrabold tracking-tight md:mb-6 md:text-xl">
            <span className="material-symbols-outlined text-primary" aria-hidden>person_add</span>
            Admission Summary
          </h2>

          <div className="mb-6 rounded-lg bg-surface-container-low p-4 md:mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl" aria-hidden>school</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{admission.studentName}</h3>
                <p className="text-sm text-on-surface-variant">{admission.classLabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{row.label}</span>
                <span className="max-w-[60%] text-right font-medium text-on-surface">{row.value}</span>
              </div>
            ))}
          </div>

          {admission.remarks && (
            <>
              <div className="my-5 h-px bg-surface-container-high" />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Remarks</span>
                <p className="mt-2 text-sm text-on-surface">{admission.remarks}</p>
              </div>
            </>
          )}

          <div className="my-5 h-px bg-surface-container-high" />

          <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
            <span className="text-sm font-bold text-on-surface">Amount Payable</span>
            <span className="text-xl font-extrabold text-primary">{formatCurrency(admission.amount)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-base" aria-hidden>info</span>
            Standalone admissions record — isolated from Books &amp; Uniform transactions.
          </div>
        </div>
      </div>
    </aside>
  )
}
