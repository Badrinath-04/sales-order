/**
 * Active school-campus branches only (excludes soft-deleted rows and legacy hub types).
 * Use in list queries, reports, and inventory distribution targets.
 */
const OPERATIONAL_BRANCH_FILTER = {
  isActive: true,
  deletedAt: null,
  type: 'BRANCH',
}

module.exports = { OPERATIONAL_BRANCH_FILTER }
