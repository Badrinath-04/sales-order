export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${className}`}>{children}</table>
    </div>
  )
}

export function THead({ children, className = '' }) {
  return <thead className={className}>{children}</thead>
}

export function TBody({ children, className = '' }) {
  return <tbody className={className}>{children}</tbody>
}

export function Tr({ children, className = '', ...rest }) {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  )
}

export function Th({ children, className = '', ...rest }) {
  return (
    <th
      className={`px-6 py-4 font-label text-xs font-medium uppercase tracking-wider text-on-surface-variant ${className}`}
      {...rest}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '', ...rest }) {
  return (
    <td className={`px-6 py-4 font-body text-sm ${className}`} {...rest}>
      {children}
    </td>
  )
}
