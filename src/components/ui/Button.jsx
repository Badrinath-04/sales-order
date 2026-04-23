import { forwardRef } from 'react'

const variants = {
  primary:
    'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-secondary text-on-secondary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  tertiary:
    'bg-tertiary text-on-tertiary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  surface:
    'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-transparent',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
  gradient:
    'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg hover:scale-[1.02] active:scale-[0.98]',
  outline: 'border border-outline-variant/30 bg-transparent hover:bg-surface-container-low',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-bold rounded-lg',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl',
  lg: 'px-10 py-5 text-lg font-bold rounded-xl',
  icon: 'p-2 rounded-full',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
