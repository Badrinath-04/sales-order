export default function FilterBar({ children, className = '' }) {
  return <div className={`flex flex-wrap items-end gap-3 ${className}`}>{children}</div>
}
