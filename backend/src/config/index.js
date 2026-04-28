require('dotenv').config()

function parseCorsOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

const corsOriginList = parseCorsOrigins(
  process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173',
)

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOriginList,
}

if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-secret-change-in-production') {
  throw new Error('JWT_SECRET must be set in production')
}

module.exports = config
