function ok(res, data, meta) {
  const body = { success: true, data }
  if (meta) body.meta = meta
  return res.json(body)
}

function created(res, data) {
  return res.status(201).json({ success: true, data })
}

function noContent(res) {
  return res.status(204).end()
}

function badRequest(res, message, errors) {
  return res.status(400).json({ success: false, message, errors })
}

function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message })
}

function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, message })
}

function notFound(res, message = 'Not found') {
  return res.status(404).json({ success: false, message })
}

function serverError(res, errOrMessage = 'Internal server error') {
  const isErr = errOrMessage && typeof errOrMessage === 'object'
  const err = isErr ? errOrMessage : null
  const message = isErr ? 'Internal server error' : errOrMessage

  // Prisma DB connectivity (Neon / pooled connections)
  // P1001: Can't reach database server
  // P2024: Timed out fetching a new connection from the connection pool
  const code = err?.code
  if (code === 'P1001' || code === 'P2024') {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please retry in a few seconds.',
      code,
    })
  }

  return res.status(500).json({ success: false, message })
}

module.exports = { ok, created, noContent, badRequest, unauthorized, forbidden, notFound, serverError }
