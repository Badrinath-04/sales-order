/**
 * Admin Permission Enforcement Tests
 *
 * Tests the requirePermission middleware and permission logic in auth.js.
 * Uses jest mock objects — no live DB or HTTP server required.
 *
 * Run: cd backend && npx jest src/__tests__/permissions.test.js
 */

'use strict'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fake Express request with a JWT payload (as set by `authenticate`). */
function makeReq({ role = 'ADMIN', id = 'user-1', branchId = 'branch-darga', permissions = null } = {}) {
  return { user: { id, role, branchId }, query: {}, params: {} }
}

/** Capture the HTTP status and JSON body sent by middleware. */
function makeRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this },
    json(body) { this._body = body; return this },
  }
  return res
}

function makeNext() {
  const fn = jest.fn()
  return fn
}

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

let mockUserRow = null   // controlled per test

jest.mock('../services/prisma', () => ({
  user: {
    findUnique: jest.fn(async () => mockUserRow),
  },
}))

// ─── Import after mock is registered ─────────────────────────────────────────

const { requirePermission, enforceBranchScope, requireRole, requireSuperAdmin } = require('../middleware/auth')

// ─── Test utility: run a middleware and collect outcome ───────────────────────

async function runMiddleware(middleware, req, res) {
  const next = makeNext()
  await middleware(req, res, next)
  return { next, status: res._status, body: res._body }
}

// =============================================================================
// SUITE 1 — requirePermission: Stock & Inventory
// =============================================================================

describe('requirePermission — Stock & Inventory', () => {

  // ── canUpdateStock ────────────────────────────────────────────────────────

  test('✓ ADMIN WITH canUpdateStock:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canUpdateStock: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res._status).toBeNull()
  })

  test('✓ ADMIN WITHOUT canUpdateStock → 403 Forbidden', async () => {
    mockUserRow = { isActive: true, permissions: { canUpdateStock: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ ADMIN with no explicit perms → defaults for ADMIN → canUpdateStock is false → 403', async () => {
    mockUserRow = { isActive: true, permissions: null }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  // ── canBulkEditStock ──────────────────────────────────────────────────────

  test('✓ ADMIN WITH canBulkEditStock:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canBulkEditStock: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canBulkEditStock'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ ADMIN WITHOUT canBulkEditStock → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canBulkEditStock: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canBulkEditStock'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  // ── canViewStockLogs ──────────────────────────────────────────────────────

  test('✓ ADMIN WITH canViewStockLogs:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewStockLogs: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewStockLogs'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ ADMIN WITHOUT canViewStockLogs → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewStockLogs: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewStockLogs'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  // ── canCreateProducts ─────────────────────────────────────────────────────

  test('✓ ADMIN WITH canCreateProducts:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateProducts: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canCreateProducts'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ ADMIN WITHOUT canCreateProducts → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateProducts: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canCreateProducts'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  // ── canAdjustStock ────────────────────────────────────────────────────────

  test('✓ ADMIN WITH canAdjustStock:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canAdjustStock: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canAdjustStock'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// SUITE 2 — requirePermission: Orders & Students
// =============================================================================

describe('requirePermission — Orders & Students', () => {

  test('✓ WITH canPlaceOrders → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canPlaceOrders: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canPlaceOrders'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canPlaceOrders (explicit false) → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canPlaceOrders: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canPlaceOrders'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ WITH canManageStudents → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canManageStudents: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canManageStudents'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canManageStudents → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canManageStudents: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canManageStudents'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ WITH canBulkImport → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canBulkImport: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canBulkImport'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITH canResetStudentData → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canResetStudentData: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canResetStudentData'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canResetStudentData → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canResetStudentData: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canResetStudentData'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })
})

// =============================================================================
// SUITE 3 — requirePermission: Financials
// =============================================================================

describe('requirePermission — Financials', () => {

  test('✓ WITH canViewTransactions → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewTransactions: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewTransactions'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canViewTransactions → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewTransactions: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewTransactions'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ WITH canViewRevenue → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewRevenue: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewRevenue'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canViewRevenue → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewRevenue: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewRevenue'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })
})

// =============================================================================
// SUITE 4 — requirePermission: Screens & Navigation
// =============================================================================

describe('requirePermission — Screens & Navigation', () => {

  test('✓ WITH canViewDashboard → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewDashboard: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewDashboard'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canViewDashboard (default ADMIN=true, but overridden to false) → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewDashboard: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewDashboard'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ WITH canViewSettings → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewSettings: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewSettings'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ WITHOUT canViewSettings → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewSettings: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewSettings'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })
})

// =============================================================================
// SUITE 5 — Account Status (isActive flag)
// =============================================================================

describe('Account Status enforcement', () => {

  test('✓ Inactive account with valid token → 401 Unauthorized regardless of permissions', async () => {
    mockUserRow = { isActive: false, permissions: { canUpdateStock: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(401)
  })

  test('✓ Active account with all permissions set to true → next() called', async () => {
    mockUserRow = {
      isActive: true,
      permissions: {
        canUpdateStock: true, canAdjustStock: true, canBulkEditStock: true,
        canCreateProducts: true, canViewStockLogs: true, canPlaceOrders: true,
        canManageStudents: true, canViewTransactions: true, canViewRevenue: true,
        canViewDashboard: true, canViewReports: true, canViewSettings: true,
      },
    }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// SUITE 6 — SUPER_ADMIN bypass
// =============================================================================

describe('SUPER_ADMIN permission bypass', () => {

  test('✓ SUPER_ADMIN always passes requirePermission (no DB lookup needed)', async () => {
    // mockUserRow deliberately not set — SUPER_ADMIN should never reach the DB check
    mockUserRow = null
    const req = makeReq({ role: 'SUPER_ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res._status).toBeNull()
  })

  test('✓ SUPER_ADMIN passes requireSuperAdmin', () => {
    const req = makeReq({ role: 'SUPER_ADMIN' })
    const res = makeRes()
    const next = makeNext()
    requireSuperAdmin(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ ADMIN fails requireSuperAdmin → 403', () => {
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const next = makeNext()
    requireSuperAdmin(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })
})

// =============================================================================
// SUITE 7 — Branch Scoping (enforceBranchScope)
// =============================================================================

describe('Branch Scoping', () => {

  test('✓ SUPER_ADMIN can access any branch path param', () => {
    const req = makeReq({ role: 'SUPER_ADMIN', branchId: 'any-branch' })
    req.params = { branchId: 'another-branch' }
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res._status).toBeNull()
  })

  test('✓ ADMIN accessing their own branchId path param → next() called', () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga' })
    req.params = { branchId: 'branch-darga' }
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ ADMIN accessing different branchId path param → 403 (cross-branch denied)', () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga' })
    req.params = { branchId: 'branch-narsingi' }
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ ADMIN with no branchId assigned → 403', () => {
    const req = makeReq({ role: 'ADMIN', branchId: null })
    req.params = {}
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ ADMIN query.branchId is overwritten by token branchId (spoof protection)', () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga' })
    req.query = { branchId: 'branch-narsingi' }  // attempt to spoof
    req.params = {}
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(req.query.branchId).toBe('branch-darga')  // enforced to token branch
  })
})

// =============================================================================
// SUITE 8 — requireRole
// =============================================================================

describe('requireRole', () => {

  test('✓ Correct role → next() called', () => {
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const next = makeNext()
    requireRole('ADMIN')(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ Wrong role → 403', () => {
    const req = makeReq({ role: 'SENIOR_ADMIN' })
    const res = makeRes()
    const next = makeNext()
    requireRole('ADMIN')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })

  test('✓ Multiple allowed roles — first matches → next() called', () => {
    const req = makeReq({ role: 'SENIOR_ADMIN' })
    const res = makeRes()
    const next = makeNext()
    requireRole('ADMIN', 'SENIOR_ADMIN')(req, res, next)
    expect(next).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// SUITE 9 — Missing user (unauthenticated)
// =============================================================================

describe('Unauthenticated access', () => {

  test('✓ requirePermission with no req.user → 401', async () => {
    const req = { user: null, query: {}, params: {} }
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canUpdateStock'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(401)
  })

  test('✓ requireRole with no req.user → 401', () => {
    const req = { user: null }
    const res = makeRes()
    const next = makeNext()
    requireRole('ADMIN')(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(401)
  })

  test('✓ enforceBranchScope with no req.user → 401', () => {
    const req = { user: null, query: {}, params: {} }
    const res = makeRes()
    const next = makeNext()
    enforceBranchScope(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(401)
  })
})

// =============================================================================
// SUITE 10 — canViewReports / canViewSales rename compatibility
// =============================================================================

describe('canViewReports / canViewSales rename compatibility', () => {

  test('✓ permissions.canViewReports:true → next() called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewReports: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewReports'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ permissions.canViewSales:true (legacy key) → canViewReports passes', async () => {
    mockUserRow = { isActive: true, permissions: { canViewSales: true } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewReports'), req, res)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('✓ permissions.canViewSales:false → canViewReports denied', async () => {
    mockUserRow = { isActive: true, permissions: { canViewSales: false } }
    const req = makeReq({ role: 'ADMIN' })
    const res = makeRes()
    const { next } = await runMiddleware(requirePermission('canViewReports'), req, res)
    expect(next).not.toHaveBeenCalled()
    expect(res._status).toBe(403)
  })
})
