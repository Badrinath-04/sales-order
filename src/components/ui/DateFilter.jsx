import SelectDropdown from './SelectDropdown'

const DEFAULT_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'term', label: 'Current Term' },
]

export default function DateFilter({
  label = 'Period',
  value,
  onChange,
  openMenu,
  setOpenMenu,
  menuKey = 'date-range',
  options = DEFAULT_OPTIONS,
  compact = false,
}) {
  return (
    <SelectDropdown
      label={label}
      icon="calendar_today"
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
