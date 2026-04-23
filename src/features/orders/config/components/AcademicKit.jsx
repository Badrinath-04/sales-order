export default function AcademicKit({ value, onChange }) {
  const setField = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-3xl bg-surface-container-low p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <span className="material-symbols-outlined text-primary" data-icon="menu_book" aria-hidden>
              menu_book
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold">Full Academic Kit</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            Recommended
          </span>
          <span className="text-2xl font-bold text-primary">$230.00</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-2 ring-primary/20 transition-all">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-4">
              <input
                checked
                disabled
                className="h-5 w-5 cursor-not-allowed rounded border-outline-variant text-primary opacity-50 focus:ring-2 focus:ring-primary"
                type="checkbox"
                readOnly
                aria-label="Mandatory workbooks included"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                  <span className="material-symbols-outlined text-primary" data-icon="auto_stories" aria-hidden>
                    auto_stories
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">Mandatory Workbooks</h4>
                  <p className="text-xs text-on-surface-variant">Core Subjects (Set of 6)</p>
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <span className="font-bold text-primary">$120.00</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-6 md:flex-row md:items-center">
            <input
              className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
              type="checkbox"
              checked={value.textbooks}
              onChange={(e) => setField({ textbooks: e.target.checked })}
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="book" aria-hidden>
                  book
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface">Textbooks</h4>
                <p className="text-xs text-on-surface-variant">Reference materials pack</p>
              </div>
            </div>
            <div className="action-controls flex w-full items-center justify-end gap-4 transition-all duration-300 md:ml-auto md:w-auto">
              <select
                className="min-w-[140px] rounded-xl border-none bg-surface-container-highest px-3 py-2 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary"
                value={value.textbookOption}
                onChange={(e) => setField({ textbookOption: e.target.value })}
              >
                <option>All Subjects</option>
                <option>Math only</option>
                <option>Science only</option>
                <option>Social only</option>
              </select>
              <span className="min-w-[60px] text-right font-semibold text-on-surface">$85.00</span>
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-6 md:flex-row md:items-center">
            <input
              className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
              type="checkbox"
              checked={value.notebooks}
              onChange={(e) => setField({ notebooks: e.target.checked })}
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="edit_note" aria-hidden>
                  edit_note
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface">Notebooks</h4>
                <p className="text-xs text-on-surface-variant">Student ruled journals</p>
              </div>
            </div>
            <div className="action-controls flex w-full items-center justify-end gap-4 transition-all duration-300 md:ml-auto md:w-auto">
              <select
                className="min-w-[140px] rounded-xl border-none bg-surface-container-highest px-3 py-2 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary"
                value={value.notebookOption}
                onChange={(e) => setField({ notebookOption: e.target.value })}
              >
                <option>100 pages</option>
                <option>200 pages</option>
                <option>None</option>
              </select>
              <span className="min-w-[60px] text-right font-semibold text-on-surface">$25.00</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
