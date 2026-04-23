export default function SectionCard({ children, className = '', paddingClassName = 'p-8' }) {
  return (
    <section className={`rounded-xl bg-surface-container-low ${paddingClassName} ${className}`}>{children}</section>
  )
}
