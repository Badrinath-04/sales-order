const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCjP8LSuLGsU8SVSHrtl-ckdinFH-WjeRRE1BmUjYu9WQUzDft2_2kdfXfRr01Ic3fS413-dgfru9O8_P00NgfPhIKBr5z7x23kh6z61Yb-Mbfr-h6BN00A2Pp-rD1JGfisdYEvsvY8NNekVwUKW74C0Y112CHvuvttCsAqR3RYSSaLMGV2zemtR677Ps0erTsPcCjeZu4P7zkqTHpJpBeINzKgXURO2Wys2n8pe4y2NmvycBBuzgByGrXpbbhsMf6LDoi-AZlQ7XI'

export default function OrderSummary({ student, selectedClass, selectedSection, orderDetails, onComplete }) {
  const avatarSrc = student.avatarUrl ?? DEFAULT_AVATAR

  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-28">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 font-headline text-xl font-extrabold tracking-tight">
            <span className="material-symbols-outlined text-primary" data-icon="shopping_basket" aria-hidden>
              shopping_basket
            </span>
            Order Summary
          </h2>
          <div className="mb-8 rounded-lg bg-surface-container-low p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
                <img className="h-full w-full object-cover" alt={student.name} src={avatarSrc} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{student.name}</h3>
                <p className="text-sm text-on-surface-variant">
                  {selectedClass.name} • {selectedSection.name}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Book Kit
                </span>
                <span className="text-sm font-medium text-primary">Edit</span>
              </div>
              <div className="space-y-3">
                {orderDetails.bookKit.map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-medium">${row.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-surface-container-high" />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Uniform Kit
                </span>
                <span className="text-sm font-medium text-primary">Edit</span>
              </div>
              <div className="space-y-3">
                {orderDetails.uniformKit.length ? (
                  orderDetails.uniformKit.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{row.label}</span>
                      <span className="font-medium">${row.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">No uniform items in this order.</p>
                )}
              </div>
            </div>
            <div className="h-[2px] rounded-full bg-primary/20" />
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-medium">${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-on-surface-variant">Administrative Fee</span>
                <span className="font-medium">${orderDetails.administrativeFee.toFixed(2)}</span>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-surface-container-high pt-6">
                <span className="text-xl font-extrabold">Total Amount</span>
                <span className="text-3xl font-extrabold tracking-tight text-primary">
                  ${orderDetails.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-5 text-lg font-extrabold text-white shadow-xl shadow-primary/20 transition-transform active:scale-[0.98]"
            >
              Complete Transaction
            </button>
            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm" data-icon="lock" aria-hidden>
                lock
              </span>
              Secure encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
