export default function OrderSummary({ detail }) {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
        <span className="material-symbols-outlined text-primary" data-icon="shopping_basket" aria-hidden>
          shopping_basket
        </span>
        Order Summary
      </h3>
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between border-b border-surface-variant/30 pb-2">
          <h4 className="font-semibold text-on-surface">Book Kit</h4>
          <span className="rounded bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface-variant">
            {detail.bookBadge}
          </span>
        </div>
        <ul className="space-y-4">
          {detail.bookLines.map((line) => (
            <li key={line.title} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${line.iconBg}`}
                >
                  <span className="material-symbols-outlined" data-icon={line.icon} aria-hidden>
                    {line.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-on-surface">{line.title}</p>
                  <p className="text-xs text-on-surface-variant">{line.subtitle}</p>
                </div>
              </div>
              <span className="font-semibold text-on-surface">${line.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-surface-variant/30 pb-2">
          <h4 className="font-semibold text-on-surface">Uniform Kit</h4>
          <span className="rounded bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface-variant">
            {detail.uniformBadge}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {detail.uniformItems.map((item) => (
            <div key={item.title} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{item.title}</p>
              <p className="font-medium text-on-surface">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
      {detail.orderNotes ? (
        <div className="mt-8 border-t border-outline-variant/20 pt-6">
          <h4 className="mb-2 font-headline text-sm font-bold text-on-surface">Notes</h4>
          <p className="whitespace-pre-wrap text-sm text-on-surface-variant">{detail.orderNotes}</p>
        </div>
      ) : null}
    </section>
  )
}
