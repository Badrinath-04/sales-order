import MultiSelectDropdown from './MultiSelectDropdown'

const DEFAULT_OPTIONS = [
  { value: 'paid', label: 'Paid', count: 124 },
  { value: 'pending', label: 'Pending', count: 42 },
  { value: 'partial', label: 'Partial', count: 18 },
]

export default function StatusFilter({
  label = 'Payment status',
  value,
  onChange,
  openMenu,
  setOpenMenu,
  menuKey = 'payment-status',
  options = DEFAULT_OPTIONS,
  icon = 'tune',
  compact = false,
}) {
  return (
    <MultiSelectDropdown
      label={label}
      icon={icon}
      options={options}
      value={value}
      onChange={onChange}
      menuKey={menuKey}
      openMenu={openMenu}
      setOpenMenu={setOpenMenu}
      compact={compact}
    />
  )
}
