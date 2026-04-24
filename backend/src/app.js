const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const config = require('./config')
const errorHandler = require('./middleware/errorHandler')

const authRoutes = require('./modules/auth/auth.routes')
const branchRoutes = require('./modules/branches/branches.routes')
const inventoryRoutes = require('./modules/inventory/inventory.routes')
const transferRoutes = require('./modules/stock-transfers/transfers.routes')
const orderRoutes = require('./modules/orders/orders.routes')
const transactionRoutes = require('./modules/transactions/transactions.routes')
const reportRoutes = require('./modules/reports/reports.routes')

const app = express()

// Security
app.use(helmet())
app.use(cors({ origin: config.corsOrigin, credentials: true }))

// Rate limiting: 200 requests / minute per IP
app.use(rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

// Parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: config.nodeEnv }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/reports', reportRoutes)

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }))

// Error handler
app.use(errorHandler)

module.exports = app
