import StyledDropdown from '@/components/ui/StyledDropdown'

export default function UniformConfig({ value, onChange }) {
  const setField = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-3xl bg-surface-container-low p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <span className="material-symbols-outlined text-primary" data-icon="apparel" aria-hidden>
              apparel
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold">Uniform Configuration</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Include Uniform Kit
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              className="peer sr-only"
              type="checkbox"
              checked={value.includeKit}
              onChange={(e) => setField({ includeKit: e.target.checked })}
            />
            <div className="relative h-6 w-11 rounded-full bg-surface-container-highest peer-checked:bg-primary peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
          </label>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-2 ring-primary/20 transition-all">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-6 md:flex-row md:items-center">
            <input
              className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
              type="checkbox"
              checked={value.shirt}
              onChange={(e) => setField({ shirt: e.target.checked })}
              disabled={!value.includeKit}
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                <span className="material-symbols-outlined text-primary" data-icon="checkroom" aria-hidden>
                  checkroom
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface">Oxford Shirt</h4>
                <p className="text-xs text-on-surface-variant">$45.00 • Half Sleeve</p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                Size: Medium (38)
                <span className="material-symbols-outlined text-xs" aria-hidden>
                  edit
                </span>
              </div>
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-6 md:flex-row md:items-center">
            <input
              className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
              type="checkbox"
              checked={value.trousers}
              onChange={(e) => setField({ trousers: e.target.checked })}
              disabled={!value.includeKit}
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="dry_cleaning" aria-hidden>
                  dry_cleaning
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface">Cotton Trousers</h4>
                <p className="text-xs text-on-surface-variant">$65.00 • Standard Fit</p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <StyledDropdown
                className="min-w-[140px]"
                value={value.trousersWaist}
                onChange={(nextValue) => setField({ trousersWaist: nextValue })}
                disabled={!value.includeKit}
                options={[
                  { value: '32 Waist', label: '32 Waist' },
                  { value: '34 Waist', label: '34 Waist' },
                ]}
              />
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-transparent bg-surface-container-lowest p-5 transition-all hover:border-outline-variant/10">
          <label className="order-config-row flex w-full cursor-pointer flex-col gap-6 md:flex-row md:items-center">
            <input
              className="item-checkbox h-5 w-5 shrink-0 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary"
              type="checkbox"
              checked={value.socks}
              onChange={(e) => setField({ socks: e.target.checked })}
              disabled={!value.includeKit}
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" data-icon="footprint" aria-hidden>
                  footprint
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-on-surface">Logo Socks</h4>
                <p className="text-xs text-on-surface-variant">$15.00 • Pack of 3</p>
              </div>
            </div>
            <div className="action-controls flex w-full justify-end transition-all duration-300 md:ml-auto md:w-auto">
              <StyledDropdown
                className="min-w-[140px]"
                value={value.socksSize}
                onChange={(nextValue) => setField({ socksSize: nextValue })}
                disabled={!value.includeKit}
                options={[
                  { value: 'L (9-12)', label: 'L (9-12)' },
                  { value: 'M (6-8)', label: 'M (6-8)' },
                ]}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
