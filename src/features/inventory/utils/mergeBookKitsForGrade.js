/**
 * Merge book kit items for the same grade across branches (same catalogKey or same label+type+price).
 * Combines bookStocks by branchId so "All branches" totals are correct.
 */
export function mergeBookKitsForGrade(classList, grade) {
  const g = Number(grade)
  if (Number.isNaN(g)) return null
  const rows = classList.filter((c) => Number(c.grade) === g && c.bookKit?.items?.length)
  if (!rows.length) return null

  const byKey = new Map()
  for (const cls of rows) {
    for (const item of cls.bookKit.items) {
      const key =
        item.catalogKey ||
        `${String(item.label)}|||${item.productType ?? 'SET'}|||${Number(item.price)}`
      if (!byKey.has(key)) {
        byKey.set(key, {
          ...item,
          bookStocks: (item.bookStocks ?? []).map((s) => ({
            ...s,
            quantity: Number(s.quantity ?? 0),
          })),
        })
      } else {
        const acc = byKey.get(key)
        for (const s of item.bookStocks ?? []) {
          const q = Number(s.quantity ?? 0)
          const existing = acc.bookStocks.find((x) => x.branchId === s.branchId)
          if (existing) existing.quantity += q
          else acc.bookStocks.push({ ...s, quantity: q })
        }
      }
    }
  }

  const first = rows[0]
  let lastUpdated = first.bookKit?.lastUpdated
  for (const r of rows) {
    const lu = r.bookKit?.lastUpdated
    if (lu && (!lastUpdated || new Date(lu) > new Date(lastUpdated))) lastUpdated = lu
  }

  return {
    ...first,
    bookKit: {
      ...first.bookKit,
      lastUpdated,
      items: Array.from(byKey.values()),
    },
  }
}
