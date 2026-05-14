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

function serverError(res, message = 'Internal server error') {
  return res.status(500).json({ success: false, message })
}

module.exports = { ok, created, noContent, badRequest, unauthorized, forbidden, notFound, serverError }
