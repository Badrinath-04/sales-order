import { forwardRef } from 'react'

const Input = forwardRef(function Input({ className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border-none bg-surface-container-highest px-4 py-2 text-sm transition-all placeholder:text-outline focus:ring-2 focus:ring-primary ${className}`}
      {...rest}
    />
  )
})

export default Input
