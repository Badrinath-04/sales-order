const { ZodError } = require('zod')

function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body)
      if (schema.params) req.params = schema.params.parse(req.params)
      if (schema.query) req.query = schema.query.parse(req.query)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues ?? err.errors ?? []
        return res.status(400).json({
          success: false,
          message: issues[0]?.message ?? 'Validation error',
          data: null,
          error: issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        })
      }
      next(err)
    }
  }
}

module.exports = validate
