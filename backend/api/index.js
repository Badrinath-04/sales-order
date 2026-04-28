// Vercel serverless entrypoint for backend service
require('../src/config')
const app = require('../src/app')

module.exports = app
