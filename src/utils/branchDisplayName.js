/** Short campus labels for UI (transactions, orders, filters, print). */
const BY_CODE = {
  'CAMP-A': 'Darga',
  'CAMP-B': 'Narsingi',
  'CAMP-C': 'Shaikpet',
  NHS_DARGA: 'Darga',
  SVN_NARSINGI: 'Narsingi',
  NS_SHAIKPET: 'Shaikpet',
}

function fromFullName(name) {
  const n = String(name ?? '').toLowerCase()
  if (n.includes('darga')) return 'Darga'
  if (n.includes('narsingi')) return 'Narsingi'
  if (n.includes('shaikpet') || n.includes('sheikpet')) return 'Shaikpet'
  return null
}

/**
 * @param {{ name?: string, code?: string } | string | null | undefined} branch
 */
export function branchDisplayName(branch) {
  if (!branch) return '—'
  if (typeof branch === 'string') {
    return fromFullName(branch) ?? branch
  }
  const code = branch.code
  if (code && BY_CODE[code]) return BY_CODE[code]
  const short = fromFullName(branch.name)
  if (short) return short
  return branch.name ?? '—'
}
