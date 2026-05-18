const { OPERATIONAL_BRANCH_FILTER } = require('./operationalBranch')

/**
 * Resolves branch filter for transaction/order queries.
 * Requires explicit allBranches=true when no branchId (Super Admin "All campuses").
 */
function resolveTransactionBranchScope(query) {
  const { branchId, allBranches } = query
  const allBranchesExplicit =
    allBranches === true ||
    allBranches === 'true' ||
    allBranches === '1'

  if (branchId) {
    return { branchId, allBranches: false }
  }

  if (allBranchesExplicit) {
    return { branchFilter: OPERATIONAL_BRANCH_FILTER, allBranches: true }
  }

  return {
    error:
      'branchId is required, or pass allBranches=true for all operational campuses.',
  }
}

function applyBranchToTransactionWhere(conditions, scope) {
  if (scope.branchId) {
    conditions.push({ branchId: scope.branchId })
  } else if (scope.branchFilter) {
    conditions.push({ branch: scope.branchFilter })
  }
}

function applyBranchToOrderWhere(conditions, scope) {
  if (scope.branchId) {
    conditions.push({ branchId: scope.branchId })
  } else if (scope.branchFilter) {
    conditions.push({ branch: scope.branchFilter })
  }
}

module.exports = {
  resolveTransactionBranchScope,
  applyBranchToTransactionWhere,
  applyBranchToOrderWhere,
}
