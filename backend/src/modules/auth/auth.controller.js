const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../../services/prisma')
const { jwtSecret, jwtExpiresIn } = require('../../config')
const { ok, created, badRequest, unauthorized, serverError } = require('../../utils/response')

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
}

/** Align JWT/API permissions with rename canViewSales → canViewReports (matches frontend normalize). */
function normalizePermissionsJson(raw) {
  if (raw == null || typeof raw !== 'object') return raw
  const o = { ...raw }
  if (typeof o.canViewSales === 'boolean' && typeof o.canViewReports === 'undefined') {
    o.canViewReports = o.canViewSales
  }
  return o
}

function buildUserPayload(user) {
  return {
    sub: user.id,
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    branchId: user.branchId,
    permissions: normalizePermissionsJson(user.permissions) ?? null,
  }
}

function buildUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    branch: user.branch,
    permissions: normalizePermissionsJson(user.permissions) ?? null,
    mustChangePassword: user.mustChangePassword ?? false,
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return badRequest(res, 'Username and password are required')
    }
    const identifier = String(username).trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: { branch: { select: { id: true, name: true, code: true, type: true, deletedAt: true } } },
    })

    if (!user) return unauthorized(res, 'Invalid credentials')
    if (user.branchId && user.branch?.deletedAt) {
      return unauthorized(res, 'This branch is no longer available. Contact your administrator.')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return unauthorized(res, 'Invalid credentials')

    const payload = buildUserPayload(user)
    const token = signToken(payload)

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '30d' }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    return ok(res, {
      token,
      refreshToken: refreshToken.token,
      user: buildUserResponse(user),
    })
  } catch (err) {
    console.error(err)
    return serverError(res)
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: req.user.id } })
    }
    return ok(res, { message: 'Logged out' })
  } catch {
    return ok(res, { message: 'Logged out' })
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return badRequest(res, 'Refresh token required')

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { branch: { select: { id: true, name: true, code: true, type: true, deletedAt: true } } } } },
    })

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      return unauthorized(res, 'Invalid or expired refresh token')
    }
    if (stored.user.branchId && stored.user.branch?.deletedAt) {
      return unauthorized(res, 'Invalid or expired refresh token')
    }

    const payload = buildUserPayload(stored.user)
    const token = signToken(payload)
    return ok(res, { token })
  } catch {
    return serverError(res)
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { branch: { select: { id: true, name: true, code: true, type: true, deletedAt: true } } },
    })
    if (!user) return unauthorized(res)
    if (user.branchId && user.branch?.deletedAt) {
      return unauthorized(res, 'This branch is no longer available.')
    }
    return ok(res, buildUserResponse(user))
  } catch {
    return serverError(res)
  }
}

module.exports = { login, logout, me, refresh }
