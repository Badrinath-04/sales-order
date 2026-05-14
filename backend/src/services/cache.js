const NodeCache = require('node-cache')

// TTLs in seconds
const TTL = {
  SHORT: 30,
  MEDIUM: 300,
  LONG: 900,
  KPI: 60,
}

const cache = new NodeCache({ stdTTL: TTL.MEDIUM, checkperiod: 120 })

function get(key) {
  return cache.get(key)
}

function set(key, value, ttl) {
  cache.set(key, value, ttl ?? TTL.MEDIUM)
}

function del(key) {
  cache.del(key)
}

function delByPrefix(prefix) {
  const keys = cache.keys().filter((k) => k.startsWith(prefix))
  cache.del(keys)
}

function flush() {
  cache.flushAll()
}

module.exports = { get, set, del, delByPrefix, flush, TTL }
