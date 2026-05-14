const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')
const prisma = require('../services/prisma')
const { unauthorized, forbidden } = require('../utils/response')

const BRANCH_SCOPED_ROLES = ['ADMIN', 'SENIOR_ADMIN']

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Authentication token required')
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.user = payload
    next()
  } catch {
    return unauthorized(res, 'Invalid or expired token')
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res)
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions')
    }
    next()
  }
}

function requireSuperAdmin(req, res, next) {
  return requireRole('SUPER_ADMIN')(req, res, next)
}

// SUPER_ADMIN can access any branch; ADMIN and SENIOR_ADMIN are branch-scoped
function enforceBranchScope(req, res, next) {
  if (!req.user) return unauthorized(res)
  if (req.user.role === 'SUPER_ADMIN') return next()

  const tokenBranchId = req.user.branchId
  if (!tokenBranchId) {
    return forbidden(res, 'No branch assigned to this account')
  }

  const pathBranchId = req.params.branchId
  if (pathBranchId && pathBranchId !== tokenBranchId) {
    return forbidden(res, 'Access to this branch is not allowed')
  }

  // Ignore client query.branchId — always trust token (avoids drift vs /auth/me or stale UI state)
  req.query.branchId = tokenBranchId
  next()
}

/** Resolve explicit permission from JWT JSON (handles rename canViewSales → canViewReports). */
function explicitPermission(perms, permKey) {
  if (!perms || typeof perms !== 'object') return undefined
  if (permKey === 'canViewReports') {
    if (typeof perms.canViewReports !== 'undefined') return perms.canViewReports
    if (typeof perms.canViewSales !== 'undefined') return perms.canViewSales
    return undefined
  }
  return perms[permKey]
}

// Default permissions by role when DB `permissions` is null (no overrides)
const ROLE_DEFAULT_PERMISSIONS = {
  SENIOR_ADMIN: {
    canViewDashboard: true,
    canViewReports: true,
    canViewSettings: true,
    canUpdateStock: true,
    canAdjustStock: false,
    canBulkEditStock: false,
    canCreateProducts: false,
    canViewStockLogs: false,
    canManagePublishers: false,
    canManageAccounts: false,
    canViewPublisherFinancials: false,
    canPlaceOrders: true,
    canManageStudents: true,
    canBulkImport: false,
    canResetStudentData: false,
    canViewTransactions: false,
    canViewRevenue: false,
  },
  ADMIN: {
    canViewDashboard: true,
    canViewReports: true,
    canViewSettings: true,
    canUpdateStock: false,
    canAdjustStock: false,
    canBulkEditStock: false,
    canCreateProducts: false,
    canViewStockLogs: false,
    canManagePublishers: false,
    canManageAccounts: false,
    canViewPublisherFinancials: false,
    canPlaceOrders: true,
    canManageStudents: true,
    canBulkImport: false,
    canResetStudentData: false,
    canViewTransactions: true,
    canViewRevenue: true,
  },
}

/**
 * Authorize using **current** DB permissions so grants/revokes apply without forcing re-login.
 * When `User.permissions` is null, use role defaults only (ignore stale JWT permission flags).
 */
function requirePermission(permKey) {
  return async (req, res, next) => {
    try {
      if (!req.user) return unauthorized(res)
      if (req.user.role === 'SUPER_ADMIN') return next()

      const row = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { permissions: true, isActive: true },
      })

      if (!row?.isActive) {
        return unauthorized(res, 'Account inactive or no longer available')
      }

      let perms = null
      if (row.permissions != null && typeof row.permissions === 'object') {
        perms = row.permissions
      }

      const explicit = explicitPermission(perms, permKey)
      if (typeof explicit !== 'undefined') {
        if (!explicit) return forbidden(res, 'Permission denied')
        return next()
      }

      const defaults = ROLE_DEFAULT_PERMISSIONS[req.user.role] ?? {}
      if (defaults[permKey] === false) return forbidden(res, 'Permission denied')
      next()
    } catch (err) {
      next(err)
    }
  }
}

module.exports = { authenticate, requireRole, requireSuperAdmin, enforceBranchScope, requirePermission }
