import { sumPaymentBucketsFromTransactions } from './paymentBuckets'

/**
 * Single source of truth for transactions list, KPIs, dues, and print report API params.
 */
export function buildTransactionQueryParams({
  effectiveBranchId,
  allBranchesSelected,
  appliedFilters,
  dateRange,
  limit = 100,
  page,
  forDues = false,
}) {
  const base = {
    limit,
    ...(page != null ? { page } : {}),
    ...dateRange,
    ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
    ...(appliedFilters.class ? { classGrade: appliedFilters.class } : {}),
  }

  if (forDues) {
    return {
      ...base,
      ...(allBranchesSelected ? { allBranches: true } : { branchId: effectiveBranchId }),
      ...(appliedFilters.status ? { paymentStatus: appliedFilters.status } : {}),
      ...(appliedFilters.method ? { paymentMethod: appliedFilters.method } : {}),
    }
  }

  return {
    ...base,
    ...(allBranchesSelected ? { allBranches: true } : { branchId: effectiveBranchId }),
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.method ? { paymentMethod: appliedFilters.method } : {}),
  }
}

/** Dedupe by transaction id and enforce branch scope on the client (safety net). */
export function normalizeTransactions(rawTransactions, { branchId, allBranches } = {}) {
  const list = Array.isArray(rawTransactions) ? rawTransactions : []
  const seen = new Set()
  const out = []

  for (const tx of list) {
    const txId = tx?.id
    if (!txId || seen.has(txId)) continue

    const txBranchId = tx.branchId ?? tx.order?.branch?.id ?? tx.order?.branchId
    if (!allBranches && branchId && txBranchId && txBranchId !== branchId) continue

    seen.add(txId)
    out.push(tx)
  }

  return out
}

export function computeReportSummaryFromTransactions(transactions) {
  const rows = Array.isArray(transactions) ? transactions : []
  const { cashReceived, onlineReceived, creditReceived } = sumPaymentBucketsFromTransactions(rows)

  return {
    totalTransactions: rows.length,
    totalRevenue: cashReceived + onlineReceived,
    cashReceived,
    onlineReceived,
    creditReceived,
  }
}

export function validateReportIntegrity({ reportRows, reportSummary, uiRowCount }) {
  const errors = []
  const rowCount = reportRows?.length ?? 0
  const expectedCount = reportSummary?.totalTransactions ?? 0

  if (rowCount !== uiRowCount) {
    errors.push(`Row count mismatch: UI shows ${uiRowCount}, report has ${rowCount}.`)
  }
  if (rowCount !== expectedCount) {
    errors.push(`Summary count (${expectedCount}) does not match report rows (${rowCount}).`)
  }

  const rowRevenue = (reportRows ?? []).reduce((sum, r) => {
    const method = r.kitType ?? r.paymentMethod
    if (method === 'CREDIT' || method === 'Credit') return sum
    return sum + Number(r.amount ?? 0)
  }, 0)
  const summaryRevenue = Number(reportSummary?.totalRevenue ?? 0)
  if (Math.abs(rowRevenue - summaryRevenue) > 0.01) {
    errors.push(
      `Revenue mismatch: rows total ₹${rowRevenue.toFixed(2)}, summary ₹${summaryRevenue.toFixed(2)}.`,
    )
  }

  return errors
}
