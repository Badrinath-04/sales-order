export default function PageHeader({ title, description, children, className = '' }) {
  return (
    <div className={`mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">{title}</h2>
        {description ? <p className="mt-1 text-on-surface-variant">{description}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div> : null}
    </div>
  )
}
