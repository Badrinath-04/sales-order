export default function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center font-bold ${className}`}>{children}</span>
}
