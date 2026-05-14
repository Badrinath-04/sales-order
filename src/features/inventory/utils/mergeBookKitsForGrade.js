/**
 * Merge book kit items for the same grade across *sections* (A/B/C/...) within a branch.
 *
 * IMPORTANT BUSINESS RULE:
 * Stock is maintained **class-wise (grade-wise)**, not section-wise.
 * So when merging multiple sections of the same grade, we must NOT sum quantities.
 *
 * We keep stock per branchId as the maximum quantity seen across sections
 * (typically all sections share the same stock row after normalization).
 *
 * Academic products (`bookKit`) and notebook bundles (`notebookBookKit`) are merged separately.
 */
function mergeItemsAcrossSections(rows, pickKit) {
  const byKey = new Map()
  for (const cls of rows) {
    const kit = pickKit(cls)
    if (!kit?.items?.length) continue
    for (const item of kit.items) {
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
          if (existing) existing.quantity = Math.max(Number(existing.quantity ?? 0), q)
          else acc.bookStocks.push({ ...s, quantity: q })
        }
      }
    }
  }
  return Array.from(byKey.values())
}

function maxKitLastUpdated(rows, pickKit) {
  let lastUpdated = null
  for (const r of rows) {
    const lu = pickKit(r)?.lastUpdated
    if (lu && (!lastUpdated || new Date(lu) > new Date(lastUpdated))) lastUpdated = lu
  }
  return lastUpdated
}

export function mergeBookKitsForGrade(classList, grade) {
  const g = Number(grade)
  if (Number.isNaN(g)) return null
  const rows = classList.filter(
    (c) => Number(c.grade) === g
      && ((c.bookKit?.items?.length ?? 0) > 0 || (c.notebookBookKit?.items?.length ?? 0) > 0),
  )
  if (!rows.length) return null

  const first = rows[0]
  const academicItems = mergeItemsAcrossSections(rows, (c) => c.bookKit)
  const notebookItems = mergeItemsAcrossSections(rows, (c) => c.notebookBookKit)
  const nbTemplate = rows.find((c) => c.notebookBookKit)?.notebookBookKit ?? null

  const academicLu = maxKitLastUpdated(rows, (c) => c.bookKit) ?? first.bookKit?.lastUpdated
  const notebookLu = maxKitLastUpdated(rows, (c) => c.notebookBookKit) ?? nbTemplate?.lastUpdated

  return {
    ...first,
    bookKit: first.bookKit
      ? {
          ...first.bookKit,
          lastUpdated: academicLu,
          items: academicItems,
        }
      : (academicItems.length
        ? {
            id: null,
            label: 'Academic Kit',
            badge: 'Academic Kit',
            lastUpdated: academicLu,
            items: academicItems,
          }
        : null),
    notebookBookKit: nbTemplate && notebookItems.length
      ? {
          ...nbTemplate,
          lastUpdated: notebookLu,
          items: notebookItems,
        }
      : null,
  }
}
