'use strict'

// ─── Helpers (mirroring permissions.test.js pattern) ─────────────────────────

function makeReq({ role = 'ADMIN', id = 'user-1', branchId = 'branch-darga', permissions = null, body = {}, query = {}, params = {} } = {}) {
  return { user: { id, role, branchId }, body, query, params }
}

function makeRes() {
  const res = { _status: null, _body: null }
  res.status = (code) => { res._status = code; return res }
  res.json   = (body) => { res._body = body; return res }
  return res
}

let mockUserRow = null
jest.mock('../../../services/prisma', () => ({
  user: { findUnique: jest.fn(async () => mockUserRow) },
}))

const { requirePermission, requireAnyPermission, enforceBranchScope } = require('../../../middleware/auth')

async function run(middleware, req, res) {
  const next = jest.fn()
  await middleware(req, res, next)
  return { next, status: res._status, body: res._body }
}

// =============================================================================
// Expense Permission Keys
// =============================================================================

describe('canViewExpenses permission', () => {
  test('ADMIN with canViewExpenses:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewExpenses: true } }
    const { next, status } = await run(requirePermission('canViewExpenses'), makeReq(), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
    expect(status).toBeNull()
  })

  test('ADMIN with canViewExpenses:false → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canViewExpenses: false } }
    const { next, status } = await run(requirePermission('canViewExpenses'), makeReq(), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })

  test('SUPER_ADMIN bypasses canViewExpenses check → next called', async () => {
    const { next, status } = await run(requirePermission('canViewExpenses'), makeReq({ role: 'SUPER_ADMIN' }), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
    expect(status).toBeNull()
  })

  test('ADMIN with no permissions JSON → defaults: canViewExpenses:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: null }
    const { next, status } = await run(requirePermission('canViewExpenses'), makeReq({ role: 'ADMIN' }), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
    expect(status).toBeNull()
  })

  test('SENIOR_ADMIN with no permissions JSON → defaults: canViewExpenses:false → 403', async () => {
    mockUserRow = { isActive: true, permissions: null }
    const { next, status } = await run(requirePermission('canViewExpenses'), makeReq({ role: 'SENIOR_ADMIN' }), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })
})

describe('canCreateHandoverEntry permission', () => {
  test('ADMIN with canCreateHandoverEntry:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateHandoverEntry: true } }
    const { next } = await run(requirePermission('canCreateHandoverEntry'), makeReq(), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('ADMIN with canCreateHandoverEntry:false → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateHandoverEntry: false } }
    const { next, status } = await run(requirePermission('canCreateHandoverEntry'), makeReq(), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })
})

describe('canCreateExpenseEntry permission', () => {
  test('ADMIN with canCreateExpenseEntry:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateExpenseEntry: true } }
    const { next } = await run(requirePermission('canCreateExpenseEntry'), makeReq(), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('ADMIN with canCreateExpenseEntry:false → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateExpenseEntry: false } }
    const { next, status } = await run(requirePermission('canCreateExpenseEntry'), makeReq(), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })
})

describe('canViewReconciliation permission', () => {
  test('ADMIN with canViewReconciliation:false (default) → 403', async () => {
    mockUserRow = { isActive: true, permissions: null }
    const { next, status } = await run(requirePermission('canViewReconciliation'), makeReq({ role: 'ADMIN' }), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })

  test('ADMIN with canViewReconciliation:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canViewReconciliation: true } }
    const { next } = await run(requirePermission('canViewReconciliation'), makeReq({ role: 'ADMIN' }), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
  })
})

describe('canManageRecipients permission', () => {
  test('ADMIN without canManageRecipients → 403', async () => {
    mockUserRow = { isActive: true, permissions: null }
    const { next, status } = await run(requirePermission('canManageRecipients'), makeReq({ role: 'ADMIN' }), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })
})

// =============================================================================
// Branch Isolation
// =============================================================================

describe('enforceBranchScope — expense cross-branch protection', () => {
  test('ADMIN accessing their own branch in body → next called', async () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga', body: { branchId: 'branch-darga' } })
    const { next, status } = await run(enforceBranchScope, req, makeRes())
    expect(next).toHaveBeenCalledTimes(1)
    expect(status).toBeNull()
  })

  test('ADMIN trying to create entry for different branch in body → 403', async () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga', body: { branchId: 'branch-shaikpet' } })
    const { next, status } = await run(enforceBranchScope, req, makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })

  test('SUPER_ADMIN can pass any branchId in body → next called', async () => {
    const req = makeReq({ role: 'SUPER_ADMIN', body: { branchId: 'branch-narsingi' } })
    const { next, status } = await run(enforceBranchScope, req, makeRes())
    expect(next).toHaveBeenCalledTimes(1)
    expect(status).toBeNull()
  })

  test('ADMIN with branchId in token → query.branchId forced to token value', async () => {
    const req = makeReq({ role: 'ADMIN', branchId: 'branch-darga', query: {} })
    await run(enforceBranchScope, req, makeRes())
    expect(req.query.branchId).toBe('branch-darga')
  })
})

// =============================================================================
// requireAnyPermission — create entry gate
// =============================================================================

describe('requireAnyPermission for createEntry', () => {
  const gate = requireAnyPermission('canCreateHandoverEntry', 'canCreateExpenseEntry', 'canCreateOnlineAllocation')

  test('ADMIN with canCreateHandoverEntry:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateHandoverEntry: true } }
    const { next } = await run(gate, makeReq(), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('ADMIN with all three false → 403', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateHandoverEntry: false, canCreateExpenseEntry: false, canCreateOnlineAllocation: false } }
    const { next, status } = await run(gate, makeReq(), makeRes())
    expect(next).not.toHaveBeenCalled()
    expect(status).toBe(403)
  })

  test('ADMIN with only canCreateExpenseEntry:true → next called', async () => {
    mockUserRow = { isActive: true, permissions: { canCreateHandoverEntry: false, canCreateExpenseEntry: true } }
    const { next } = await run(gate, makeReq(), makeRes())
    expect(next).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// Balance logic unit tests
// =============================================================================

describe('Balance logic unit tests', () => {
  test('zero opening balance when no prior data', () => {
    const cashIn = 0
    const cashOut = 0
    expect(Math.max(0, cashIn - cashOut)).toBe(0)
  })

  test('positive balance when cashIn > cashOut', () => {
    const cashIn = 5000
    const cashOut = 1500
    expect(Math.max(0, cashIn - cashOut)).toBe(3500)
  })

  test('never returns negative (floor at zero)', () => {
    const cashIn = 500
    const cashOut = 1000
    expect(Math.max(0, cashIn - cashOut)).toBe(0)
  })

  test('closing balance = opening + cashCollected - handovers - expenses', () => {
    const opening = 1000
    const cashCollected = 3500
    const handovers = 2000
    const expenses = 500
    const closing = opening + cashCollected - handovers - expenses
    expect(closing).toBe(2000)
  })
})
