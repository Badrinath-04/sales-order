export default function Timeline({ entries = [] }) {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="mb-8 font-headline text-xl font-bold text-on-surface">Order History & Timeline</h3>
      <div className="relative ml-3 space-y-10 border-l-2 border-surface-variant pl-8">
        {entries.map((item) => (
          <div key={item.key} className="relative">
            <div
              className={`absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-surface-container-lowest ${
                item.status === 'done'
                  ? item.iconTone === 'secondary'
                    ? 'bg-secondary'
                    : 'bg-primary'
                  : 'bg-surface-container-high'
              }`}
            >
              {item.icon ? (
                <span
                  className="material-symbols-outlined text-[12px] font-bold text-white"
                  data-icon={item.icon}
                  aria-hidden
                >
                  {item.icon}
                </span>
              ) : null}
            </div>
            <div>
              <p
                className={`font-bold ${item.status === 'pending' ? 'text-on-surface-variant' : 'text-on-surface'}`}
              >
                {item.title}
              </p>
              <p
                className={`text-sm ${item.status === 'pending' ? 'italic text-on-surface-variant/60' : 'text-on-surface-variant'}`}
              >
                {item.description}
              </p>
              {item.time ? (
                <p className="mt-1 text-xs text-on-surface-variant/60">{item.time}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
