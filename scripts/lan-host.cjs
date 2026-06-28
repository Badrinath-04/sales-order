'use strict'

const os = require('node:os')

/** @returns {string[]} Non-loopback IPv4 addresses (Wi‑Fi / Ethernet). */
function getLanIPv4Addresses() {
  const seen = new Set()
  const out = []
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      const v4 = n && (n.family === 'IPv4' || n.family === 4)
      if (!v4 || n.internal) continue
      if (seen.has(n.address)) continue
      seen.add(n.address)
      out.push(n.address)
    }
  }
  return out
}

function firstLanIPv4() {
  return getLanIPv4Addresses()[0] || null
}

module.exports = { getLanIPv4Addresses, firstLanIPv4 }
