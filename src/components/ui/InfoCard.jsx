export default function InfoCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm ${className}`}>
      {children}
    </div>
  )
}
