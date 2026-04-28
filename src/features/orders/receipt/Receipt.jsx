import './styles.scss'

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`
}

function splitUniformLabel(label) {
  const open = label.indexOf('(')
  if (open === -1) return { name: label, detail: null }
  const name = label.slice(0, open).trim()
  const rest = label.slice(open + 1).replace(/\)\s*$/, '').trim()
  return { name, detail: rest || null }
}

export default function Receipt({
  student,
  selectedClass,
  selectedSection,
  orderDetails,
  orderNotes,
  paymentMethod,
  orderId,
  receiptDate,
  receiptTime,
  addOns = ['OFFICIAL SCHOOL BELT', 'STRIPED SCHOOL TIE'],
  onPrint,
}) {
  const phone = student.parentPhone ?? '—'
  const classSection = `${selectedClass.name} - ${selectedSection.name}`
  const paidLabel = paymentMethod === 'online' ? 'Paid via Online' : 'Paid via Cash'
  const vatAmount = 0
  const processingLabel =
    orderDetails.processingFeeLabel ?? 'Platform Processing Fee (2.5%)'
  const processingAmount =
    orderDetails.processingFee ?? orderDetails.administrativeFee ?? 0

  return (
    <div className="bg-surface font-body text-on-surface antialiased transition-all duration-200 ease-in-out">
      <header className="no-print w-full border-b border-neutral-100 bg-white transition-all duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
          <h1 className="font-headline text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            School Kit Management
          </h1>
          <div className="flex gap-4">
            <button
              type="button"
              className="rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
              aria-label="Print"
              onClick={onPrint}
            >
              <span className="material-symbols-outlined" data-icon="print" aria-hidden>
                print
              </span>
            </button>
            <button
              type="button"
              className="rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
              aria-label="Share"
            >
              <span className="material-symbols-outlined" data-icon="share" aria-hidden>
                share
              </span>
            </button>
            <button
              type="button"
              className="rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
              aria-label="Download"
            >
              <span className="material-symbols-outlined" data-icon="download" aria-hidden>
                download
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4 print:p-0 md:p-12">
        <div className="no-print mb-8 flex justify-end gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-outline-variant px-6 py-3 font-semibold text-primary transition-all hover:bg-surface-container-low active:scale-95"
          >
            <span className="material-symbols-outlined" data-icon="picture_as_pdf" aria-hidden>
              picture_as_pdf
            </span>
            Download PDF
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-8 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
          >
            <span className="material-symbols-outlined" data-icon="print" aria-hidden>
              print
            </span>
            Print Receipt
          </button>
        </div>
        <div className="print-canvas overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_12px_32px_rgba(27,28,28,0.06)] print:shadow-none">
          <div className="border-b border-surface-container bg-white p-8 md:p-12">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-fixed">
                  <span
                    className="material-symbols-outlined text-3xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    data-icon="school"
                    aria-hidden
                  >
                    school
                  </span>
                </div>
                <div>
                  <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                    Academic Admin
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant">Order Management System</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="mb-1 font-headline text-3xl font-extrabold uppercase tracking-wider text-primary">
                  Official Receipt
                </h3>
                <div className="flex flex-col text-sm font-medium text-on-surface-variant">
                  <span>Order ID: {orderId}</span>
                  <span>Date: {receiptDate}</span>
                  <span>Time: {receiptTime}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-10 p-8 md:p-12">
            <div className="print-break flex flex-wrap gap-8 rounded-xl bg-surface-container-low p-8">
              <div className="min-w-[200px] flex-1">
                <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Student Name
                </p>
                <p className="text-lg font-bold text-on-surface">{student.name}</p>
              </div>
              <div className="min-w-[120px] flex-1">
                <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Class & Section
                </p>
                <p className="text-lg font-bold text-on-surface">{classSection}</p>
              </div>
              <div className="min-w-[150px] flex-1">
                <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Phone Number
                </p>
                <p className="text-lg font-bold text-on-surface">{phone}</p>
              </div>
            </div>
            {orderNotes ? (
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6">
                <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Notes
                </p>
                <p className="whitespace-pre-wrap text-sm font-medium text-on-surface">{orderNotes}</p>
              </div>
            ) : null}
            <div className="space-y-8">
              <div className="print-break">
                <div className="mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" data-icon="menu_book" aria-hidden>
                    menu_book
                  </span>
                  <h4 className="font-headline text-xl font-bold">Book Kit</h4>
                  <div className="h-px flex-1 bg-surface-container-highest" />
                </div>
                <div className="space-y-4">
                  {orderDetails.bookKit.map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1">
                      <span className="text-on-surface">{row.label}</span>
                      <span className="font-semibold">{formatMoney(row.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="print-break">
                <div className="mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" data-icon="apparel" aria-hidden>
                    apparel
                  </span>
                  <h4 className="font-headline text-xl font-bold">Uniform Kit</h4>
                  <div className="h-px flex-1 bg-surface-container-highest" />
                </div>
                <div className="space-y-4">
                  {orderDetails.uniformKit.length ? (
                    orderDetails.uniformKit.map((row) => {
                      const { name, detail } = splitUniformLabel(row.label)
                      return (
                        <div key={row.label} className="flex items-center justify-between py-1">
                          <div className="flex flex-col">
                            <span className="text-on-surface">{name}</span>
                            {detail ? (
                              <span className="text-xs font-medium text-on-surface-variant">{detail}</span>
                            ) : null}
                          </div>
                          <span className="font-semibold">{formatMoney(row.price)}</span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-on-surface-variant">No uniform items.</p>
                  )}
                </div>
              </div>
              {addOns.length ? (
                <div className="print-break">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary" data-icon="add_circle" aria-hidden>
                      add_circle
                    </span>
                    <h4 className="font-headline text-xl font-bold">Included Add-ons</h4>
                    <div className="h-px flex-1 bg-surface-container-highest" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {addOns.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary-container px-4 py-2 text-xs font-bold uppercase tracking-tight text-on-secondary-container"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="print-break mt-10 border-t border-surface-container pt-10">
              <div className="flex flex-col justify-between gap-12 md:flex-row">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2">
                    <span className="material-symbols-outlined text-sm text-primary" data-icon="payments" aria-hidden>
                      payments
                    </span>
                    <span className="text-sm font-bold text-on-surface">{paidLabel}</span>
                  </div>
                  <p className="max-w-xs text-sm italic text-on-surface-variant">
                    &quot;Transaction successful. Your school kit will be ready for pickup within 3 working days.&quot;
                  </p>
                </div>
                <div className="max-w-md flex-1 space-y-3">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatMoney(orderDetails.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>{processingLabel}</span>
                    <span className="font-medium">{formatMoney(processingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>VAT (Standard)</span>
                    <span className="font-medium">{formatMoney(vatAmount)}</span>
                  </div>
                  <div className="my-4 h-px bg-surface-container-highest" />
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-2xl font-extrabold text-on-surface">Total Amount</span>
                    <span className="font-headline text-3xl font-extrabold text-primary">
                      {formatMoney(orderDetails.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <footer className="print-break border-t border-surface-container bg-surface-container-low p-8 text-center md:p-12">
            <p className="mb-2 font-headline text-xl font-bold text-on-surface">Thank you for your order!</p>
            <p className="mb-6 text-sm text-on-surface-variant">
              Your support helps us maintain the highest academic standards.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant md:flex-row">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="mail" aria-hidden>
                  mail
                </span>
                support@academicadmin.edu
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="call" aria-hidden>
                  call
                </span>
                +1 (800) SCH-KITS
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" data-icon="public" aria-hidden>
                  public
                </span>
                www.academicadmin.edu
              </span>
            </div>
            <div className="mt-8 text-[10px] font-medium text-neutral-400">
              © 2024 School Kit Management Platform. All rights reserved. | Official Document SKM-REF-001
            </div>
          </footer>
        </div>
      </main>
      <footer className="no-print mt-12 w-full border-t border-neutral-100 bg-white transition-all duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-8 py-6 md:flex-row">
          <p className="text-xs font-medium text-neutral-400">
            © 2024 School Kit Management Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a className="text-xs font-medium text-neutral-400 opacity-80 transition-all hover:text-neutral-600 hover:opacity-100" href="#">
              Support
            </a>
            <a className="text-xs font-medium text-neutral-400 opacity-80 transition-all hover:text-neutral-600 hover:opacity-100" href="#">
              Privacy Policy
            </a>
            <a className="text-xs font-medium text-neutral-400 opacity-80 transition-all hover:text-neutral-600 hover:opacity-100" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
