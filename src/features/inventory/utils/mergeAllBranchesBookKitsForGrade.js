import { pickClassRowForGrade } from './pickClassRowForGrade'

function itemKey(item) {
  return (
    item.catalogKey ||
    `${String(item.label)}|||${item.productType ?? 'SET'}|||${Number(item.price)}`
  )
}

/** Live qty for this campus from a branch-scoped listBooks row (one stock row per item). */
function quantityForBranch(item, branchId) {
  const stocks = item.bookStocks ?? []
  const row = stocks.find((s) => s.branchId === branchId)
  if (row) return Number(row.quantity ?? 0)
  if (stocks.length === 1) return Number(stocks[0].quantity ?? 0)
  return 0
}

function mergeKitItemsFromBranches(branchSnapshots, grade, branches, pickKit) {
  const perBranch = branchSnapshots
    .map(({ branchId, classList }) => ({
      branchId,
      row: pickClassRowForGrade(classList, grade),
    }))
    .filter((x) => x.row)

  if (!perBranch.length) return []

  const byKey = new Map()

  for (const { branchId, row } of perBranch) {
    const kit = pickKit(row)
    if (!kit?.items?.length) continue
    for (const item of kit.items) {
      const key = itemKey(item)
      const qty = quantityForBranch(item, branchId)
      if (!byKey.has(key)) {
        byKey.set(key, {
          ...item,
          bookStocks: branches.map((b) => ({
            branchId: b.id,
            branchName: b.name,
            quantity: 0,
          })),
        })
      }
      const acc = byKey.get(key)
      const slot = acc.bookStocks.find((s) => s.branchId === branchId)
      if (slot) slot.quantity = qty
    }
  }

  return Array.from(byKey.values())
}

function latestLastUpdated(branchSnapshots, grade, pickKit) {
  let best = null
  for (const { classList } of branchSnapshots) {
    const row = pickClassRowForGrade(classList, grade)
    const lu = row ? pickKit(row)?.lastUpdated : null
    if (lu && (!best || new Date(lu) > new Date(best))) best = lu
  }
  return best
}

/**
 * Build grade kit view for Super Admin "All branches" by merging each campus's
 * branch-scoped listBooks payload using the same section-A row as single-branch Stock.
 *
 * @param {{ branchId: string, classList: object[] }[]} branchSnapshots
 * @param {number|string} grade
 * @param {{ id: string, name: string }[]} branches
 */
export function mergeAllBranchesBookKitsForGrade(branchSnapshots, grade, branches) {
  const g = Number(grade)
  if (Number.isNaN(g) || !branchSnapshots?.length) return null

  const template =
    pickClassRowForGrade(branchSnapshots[0].classList, g) ??
    branchSnapshots
      .map((s) => pickClassRowForGrade(s.classList, g))
      .find(Boolean)

  if (!template) return null

  const academicItems = mergeKitItemsFromBranches(
    branchSnapshots,
    g,
    branches,
    (row) => row.bookKit,
  )
  const notebookItems = mergeKitItemsFromBranches(
    branchSnapshots,
    g,
    branches,
    (row) => row.notebookBookKit,
  )

  const academicLu = latestLastUpdated(branchSnapshots, g, (row) => row?.bookKit)
  const notebookLu = latestLastUpdated(branchSnapshots, g, (row) => row?.notebookBookKit)
  const nbTemplate = template.notebookBookKit

  return {
    ...template,
    bookKit: template.bookKit
      ? {
          ...template.bookKit,
          lastUpdated: academicLu ?? template.bookKit.lastUpdated,
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
          lastUpdated: notebookLu ?? nbTemplate.lastUpdated,
          items: notebookItems,
        }
      : null,
  }
}
