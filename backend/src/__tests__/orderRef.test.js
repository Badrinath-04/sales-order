const { buildRef, allocateUniqueOrderId, allocateUniqueGroupRef } = require('../utils/orderRef')

describe('orderRef', () => {
  it('buildRef formats SKM ids', () => {
    expect(buildRef('SKM', 2026, '4509')).toBe('#SKM-2026-4509')
  })

  it('allocateUniqueOrderId uses next sequential suffix', async () => {
    const base = `#SKM-${new Date().getFullYear()}-`
    const tx = {
      order: {
        findMany: () => Promise.resolve([
          { orderId: `${base}4509` },
          { orderId: `${base}9999` },
        ]),
        findUnique: ({ where }) => Promise.resolve(
          where.orderId === `${base}10000` ? null : { id: 'taken' },
        ),
      },
    }

    const id = await allocateUniqueOrderId(tx)
    expect(id).toBe(`${base}10000`)
  })

  it('allocateUniqueGroupRef returns unused group ref', async () => {
    const year = new Date().getFullYear()
    const tx = {
      transactionGroup: {
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
      },
    }
    const ref = await allocateUniqueGroupRef(tx)
    expect(ref).toBe(`#GRP-${year}-1000`)
  })
})
