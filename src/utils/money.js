/** Parse user-entered rupee amounts without floating-point drift. */
export function parseRupeePrice(raw) {
  if (raw === null || raw === undefined || raw === '') return 0
  const cleaned = String(raw).trim().replace(/,/g, '')
  if (!cleaned) return 0
  const match = cleaned.match(/^-?\d+(?:\.\d{0,2})?/)
  if (!match) return 0
  const [whole, fraction = ''] = match[0].split('.')
  const paise = Number(whole) * 100 + Number((fraction + '00').slice(0, 2))
  return paise / 100
}

export function formatRupeePrice(price) {
  const n = parseRupeePrice(price)
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2)
}
