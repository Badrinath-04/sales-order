const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')
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

  const requestedBranch = req.params.branchId || req.query.branchId
  if (requestedBranch && requestedBranch !== req.user.branchId) {
    return forbidden(res, 'Access to this branch is not allowed')
  }
  req.query.branchId = req.user.branchId
  next()
}

// Check a specific permission flag in user.permissions JSON
// Falls back to role-based defaults if permissions field is null
function requirePermission(permKey) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res)
    if (req.user.role === 'SUPER_ADMIN') return next()

    const perms = req.user.permissions
    if (perms && typeof perms[permKey] !== 'undefined') {
      if (!perms[permKey]) return forbidden(res, 'Permission denied')
      return next()
    }

    // Default permissions by role when no explicit permissions set
    const roleDefaults = {
      SENIOR_ADMIN: {
        canUpdateStock: true,
        canAdjustStock: false,
        canBulkEditStock: false,
        canCreateProducts: false,
        canViewStockLogs: false,
        canManagePublishers: false,
        canViewPublisherFinancials: false,
        canPlaceOrders: true,
        canManageStudents: true,
        canViewTransactions: false,
        canViewRevenue: false,
        canViewReports: false,
      },
      ADMIN: {
        canUpdateStock: false,
        canAdjustStock: false,
        canBulkEditStock: false,
        canCreateProducts: false,
        canViewStockLogs: false,
        canManagePublishers: false,
        canViewPublisherFinancials: false,
        canPlaceOrders: true,
        canManageStudents: true,
        canViewTransactions: true,
        canViewRevenue: true,
        canViewReports: true,
      },
    }

    const defaults = roleDefaults[req.user.role] ?? {}
    if (defaults[permKey] === false) return forbidden(res, 'Permission denied')
    next()
  }
}

module.exports = { authenticate, requireRole, requireSuperAdmin, enforceBranchScope, requirePermission }
