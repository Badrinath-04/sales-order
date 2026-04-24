const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')
const { unauthorized, forbidden } = require('../utils/response')

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

// Admins can only access their own branch; super admin can access any
function enforceBranchScope(req, res, next) {
  if (!req.user) return unauthorized(res)
  if (req.user.role === 'SUPER_ADMIN') return next()
  // Admin: inject their branch into query/params
  const requestedBranch = req.params.branchId || req.query.branchId
  if (requestedBranch && requestedBranch !== req.user.branchId) {
    return forbidden(res, 'Access to this branch is not allowed')
  }
  req.query.branchId = req.user.branchId
  next()
}

module.exports = { authenticate, requireRole, requireSuperAdmin, enforceBranchScope }
