const bcrypt = require('bcryptjs')
const prisma = require('../../services/prisma')
const { ok, created, badRequest, notFound, serverError } = require('../../utils/response')

async function listAdmins(req, res) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SENIOR_ADMIN'] } },
      select: {
        id: true, username: true, displayName: true, role: true,
        permissions: true, isActive: true, lastLoginAt: true, mustChangePassword: true,
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return ok(res, admins)
  } catch {
    return serverError(res)
  }
}

async function createAdmin(req, res) {
  try {
    const { displayName, username, password, role, branchId, permissions } = req.body
    if (!displayName || !username || !password || !role || !branchId) {
      return badRequest(res, 'displayName, username, password, role, and branchId are required')
    }
    if (!['ADMIN', 'SENIOR_ADMIN'].includes(role)) {
      return badRequest(res, 'role must be ADMIN or SENIOR_ADMIN')
    }
    if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters')

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await prisma.user.create({
      data: {
        displayName,
        username: username.trim().toLowerCase(),
        email: `${username.trim().toLowerCase()}@campus.edu`,
        passwordHash,
        role,
        branchId,
        permissions: permissions ?? null,
        mustChangePassword: true,
      },
      select: {
        id: true, username: true, displayName: true, role: true,
        permissions: true, isActive: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    })
    return created(res, admin)
  } catch (err) {
    if (err.code === 'P2002') return badRequest(res, 'Username already exists')
    return serverError(res)
  }
}

async function updateAdmin(req, res) {
  try {
    const { displayName, role, branchId, permissions, isActive } = req.body
    const admin = await prisma.user.update({
      where: { id: req.params.adminId },
      data: { displayName, role, branchId, permissions, isActive },
      select: {
        id: true, username: true, displayName: true, role: true,
        permissions: true, isActive: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    })
    return ok(res, admin)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Admin not found')
    return serverError(res)
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body
    if (!password || password.length < 8) return badRequest(res, 'Password must be at least 8 characters')
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: req.params.adminId },
      data: { passwordHash, mustChangePassword: true },
    })
    return ok(res, { message: 'Password reset successfully' })
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Admin not found')
    return serverError(res)
  }
}

module.exports = { listAdmins, createAdmin, updateAdmin, resetPassword }
