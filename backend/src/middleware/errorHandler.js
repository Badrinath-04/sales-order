function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message)

  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists', data: null, error: err.message })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found', data: null, error: err.message })
  }

  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
    error: process.env.NODE_ENV !== 'production' ? err.stack : null,
  })
}

module.exports = errorHandler
