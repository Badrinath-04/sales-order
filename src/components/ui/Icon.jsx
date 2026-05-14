/**
 * Material Symbols wrapper — keeps `data-icon` and optional filled style.
 */
export default function Icon({ name, className = '', filled = false, ...rest }) {
  return (
    <span
      className={`material-symbols-outlined${filled ? ' material-symbols-outlined--fill' : ''}${className ? ` ${className}` : ''}`}
      data-icon={name}
      aria-hidden
      {...rest}
    >
      {name}
    </span>
  )
}
