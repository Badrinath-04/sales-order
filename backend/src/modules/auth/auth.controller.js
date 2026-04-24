const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../../services/prisma')
const { jwtSecret, jwtExpiresIn } = require('../../config')
const { ok, created, badRequest, unauthorized, serverError } = require('../../utils/response')

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
}

function buildUserPayload(user) {
  return {
    sub: user.id,
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    branchId: user.branchId,
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return badRequest(res, 'Username and password are required')
    }

    const user = await prisma.user.findFirst({
      where: { username: username.trim().toLowerCase(), isActive: true },
      include: { branch: { select: { id: true, name: true, code: true, type: true } } },
    })

    if (!user) return unauthorized(res, 'Invalid credentials')

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

    return ok(res, {
      token,
      refreshToken: refreshToken.token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        branch: user.branch,
      },
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
      include: { user: { include: { branch: { select: { id: true, name: true, code: true, type: true } } } } },
    })

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
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
      include: { branch: { select: { id: true, name: true, code: true, type: true } } },
    })
    if (!user) return unauthorized(res)
    return ok(res, {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      branch: user.branch,
    })
  } catch {
    return serverError(res)
  }
}

module.exports = { login, logout, me, refresh }
