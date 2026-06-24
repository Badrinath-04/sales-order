/**
 * Human-readable order / group refs (#SKM-YYYY-####).
 * Uses sequential suffix (max + 1) to avoid random collisions at scale (~2000+ orders/year).
 */

function buildRef(prefix, year, suffix) {
  return `#${prefix}-${year}-${suffix}`
}

function parseSuffixNum(orderId, base) {
  const raw = String(orderId).slice(base.length)
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function formatSuffix(num) {
  if (num <= 9999) return String(num).padStart(4, '0')
  return String(num)
}

async function isOrderIdTaken(tx, orderId) {
  const row = await tx.order.findUnique({ where: { orderId }, select: { id: true } })
  return Boolean(row)
}

async function isGroupRefTaken(tx, groupRef) {
  const row = await tx.transactionGroup.findUnique({ where: { groupRef }, select: { id: true } })
  return Boolean(row)
}

async function maxSuffixForPrefix(tx, base, { findRows }) {
  const rows = await findRows(base)
  let maxNum = 999
  for (const row of rows) {
    const id = row.orderId ?? row.groupRef
    const num = parseSuffixNum(id, base)
    if (num != null && num > maxNum) maxNum = num
  }
  return maxNum
}

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
async function allocateUniqueOrderId(tx, { prefix = 'SKM', reserve = 0 } = {}) {
  const year = new Date().getFullYear()
  const base = `#${prefix}-${year}-`

  const maxNum = await maxSuffixForPrefix(tx, base, {
    findRows: (b) => tx.order.findMany({
      where: { orderId: { startsWith: b } },
      select: { orderId: true },
    }),
  })

  for (let bump = 1 + reserve; bump <= 200; bump++) {
    const candidate = `${base}${formatSuffix(maxNum + bump)}`
    if (!(await isOrderIdTaken(tx, candidate))) return candidate
  }

  throw new Error('ORDER_ID_EXHAUSTED')
}

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
async function allocateUniqueGroupRef(tx, { reserve = 0 } = {}) {
  const year = new Date().getFullYear()
  const base = `#GRP-${year}-`

  const maxNum = await maxSuffixForPrefix(tx, base, {
    findRows: (b) => tx.transactionGroup.findMany({
      where: { groupRef: { startsWith: b } },
      select: { groupRef: true },
    }),
  })

  for (let bump = 1 + reserve; bump <= 200; bump++) {
    const candidate = `${base}${formatSuffix(maxNum + bump)}`
    if (!(await isGroupRefTaken(tx, candidate))) return candidate
  }

  throw new Error('GROUP_REF_EXHAUSTED')
}

module.exports = {
  buildRef,
  formatSuffix,
  parseSuffixNum,
  allocateUniqueOrderId,
  allocateUniqueGroupRef,
}
