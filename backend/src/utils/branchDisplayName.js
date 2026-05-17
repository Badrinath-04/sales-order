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

function branchDisplayName(branch) {
  if (!branch) return '—'
  if (typeof branch === 'string') return fromFullName(branch) ?? branch
  if (branch.code && BY_CODE[branch.code]) return BY_CODE[branch.code]
  return fromFullName(branch.name) ?? branch.name ?? '—'
}

module.exports = { branchDisplayName }
