const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, notFound, serverError, badRequest, forbidden } = require('../../utils/response')

function branchFilter(query) {
  return query.branchId ? { branchId: query.branchId } : {}
}

async function getKpis(req, res) {
  try {
    const bf = branchFilter(req.query)
    const cacheKey = `inventory:kpis:${req.query.branchId || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const [booksTotal, uniformsTotal] = await Promise.all([
      prisma.bookStock.aggregate({ _sum: { quantity: true }, where: bf }),
      prisma.uniformStock.aggregate({ _sum: { quantity: true }, where: bf }),
    ])

    const data = {
      booksStock: Number(booksTotal._sum.quantity || 0),
      uniformsStock: Number(uniformsTotal._sum.quantity || 0),
    }
    cache.set(cacheKey, data, cache.TTL.KPI)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
}

async function listBooks(req, res) {
  try {
    const bf = branchFilter(req.query)
    const classes = await prisma.academicClass.findMany({
      where: bf.branchId ? { branchId: bf.branchId } : {},
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      include: {
        bookKit: {
          include: {
            items: {
              include: {
                bookStocks: {
                  where: bf.branchId ? { branchId: bf.branchId } : {},
                  select: { quantity: true, tone: true, branchId: true },
                },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    })
    return ok(res, classes)
  } catch {
    return serverError(res)
  }
}

async function getBookKit(req, res) {
  try {
    const bf = branchFilter(req.query)
    const kit = await prisma.bookKit.findUnique({
      where: { id: req.params.kitId },
      include: {
        class: true,
        items: {
          include: {
            bookStocks: {
              where: bf.branchId ? { branchId: bf.branchId } : {},
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    })
    if (!kit) return notFound(res, 'Kit not found')
    return ok(res, kit)
  } catch {
    return serverError(res)
  }
}

async function updateBookStock(req, res) {
  try {
    const { branchId, quantity, notes } = req.body
    if (!branchId || quantity === undefined) return badRequest(res, 'branchId and quantity are required')

    const existing = await prisma.bookStock.findUnique({
      where: { itemId_branchId: { itemId: req.params.kitId, branchId } },
    })

    const tone = quantity <= 10 ? 'CRITICAL' : quantity <= 50 ? 'LOW' : 'NORMAL'

    let stock
    if (existing) {
      const before = existing.quantity
      stock = await prisma.bookStock.update({
        where: { itemId_branchId: { itemId: req.params.kitId, branchId } },
        data: { quantity, tone },
      })
      await prisma.inventoryLog.create({
        data: {
          branchId,
          itemType: 'BOOK',
          bookItemId: req.params.kitId,
          changeType: 'ADJUSTMENT',
          quantityBefore: before,
          quantityAfter: quantity,
          quantityDelta: quantity - before,
          performedById: req.user.id,
          notes,
        },
      })
    } else {
      stock = await prisma.bookStock.create({
        data: { itemId: req.params.kitId, branchId, quantity, tone },
      })
    }

    cache.delByPrefix(`inventory:kpis`)
    cache.delByPrefix(`branch:${branchId}`)
    return ok(res, stock)
  } catch {
    return serverError(res)
  }
}

async function listUniformCategories(req, res) {
  try {
    const cacheKey = 'uniform:categories'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const cats = await prisma.uniformCategory.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    })
    cache.set(cacheKey, cats, cache.TTL.LONG)
    return ok(res, cats)
  } catch {
    return serverError(res)
  }
}

async function listUniforms(req, res) {
  try {
    const { categoryId, branchId } = req.query
    const where = {}
    if (categoryId) where.categoryId = categoryId

    const sizes = await prisma.uniformSize.findMany({
      where,
      orderBy: { position: 'asc' },
      include: {
        category: { select: { id: true, name: true, label: true, icon: true } },
        uniformStocks: {
          where: branchId ? { branchId } : {},
          select: { quantity: true, tone: true, branchId: true },
        },
      },
    })
    return ok(res, sizes)
  } catch {
    return serverError(res)
  }
}

async function updateUniformStock(req, res) {
  try {
    const { branchId, quantity, notes } = req.body
    if (!branchId || quantity === undefined) return badRequest(res, 'branchId and quantity are required')

    const size = await prisma.uniformSize.findUnique({ where: { id: req.params.sizeId } })
    if (!size) return notFound(res, 'Uniform size not found')

    const tone = quantity <= size.reorderThreshold * 0.2 ? 'CRITICAL' : quantity <= size.reorderThreshold ? 'LOW' : 'NORMAL'

    const existing = await prisma.uniformStock.findUnique({
      where: { sizeId_branchId: { sizeId: req.params.sizeId, branchId } },
    })

    let stock
    if (existing) {
      const before = existing.quantity
      stock = await prisma.uniformStock.update({
        where: { sizeId_branchId: { sizeId: req.params.sizeId, branchId } },
        data: { quantity, tone },
      })
      await prisma.inventoryLog.create({
        data: {
          branchId,
          itemType: 'UNIFORM',
          uniformSizeId: req.params.sizeId,
          changeType: 'ADJUSTMENT',
          quantityBefore: before,
          quantityAfter: quantity,
          quantityDelta: quantity - before,
          performedById: req.user.id,
          notes,
        },
      })
    } else {
      stock = await prisma.uniformStock.create({
        data: { sizeId: req.params.sizeId, branchId, quantity, tone },
      })
    }

    cache.delByPrefix('inventory:kpis')
    cache.delByPrefix(`branch:${branchId}`)
    return ok(res, stock)
  } catch {
    return serverError(res)
  }
}

async function listAccessoryGroups(req, res) {
  try {
    const cacheKey = 'accessories:groups'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const groups = await prisma.accessoryGroup.findMany({
      orderBy: { position: 'asc' },
      include: {
        accessories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    })
    cache.set(cacheKey, groups, cache.TTL.LONG)
    return ok(res, groups)
  } catch {
    return serverError(res)
  }
}

async function getLogs(req, res) {
  try {
    const { branchId, itemType, limit = 50 } = req.query
    const where = {}
    if (branchId) where.branchId = branchId
    if (itemType) where.itemType = itemType

    const logs = await prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        performedBy: { select: { displayName: true, username: true } },
        branch: { select: { name: true, code: true } },
      },
    })
    return ok(res, logs)
  } catch {
    return serverError(res)
  }
}

module.exports = { getKpis, listBooks, getBookKit, updateBookStock, listUniformCategories, listUniforms, updateUniformStock, listAccessoryGroups, getLogs }
