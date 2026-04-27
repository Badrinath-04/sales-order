const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, notFound, serverError, badRequest, forbidden } = require('../../utils/response')
const { randomUUID } = require('crypto')

function branchFilter(query) {
  return query.branchId ? { branchId: query.branchId } : {}
}

function calcTone(qty, threshold = 50) {
  if (qty <= threshold * 0.2) return 'CRITICAL'
  if (qty <= threshold) return 'LOW'
  return 'NORMAL'
}

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }
const OPENING_NOTES = 'Opening Entry'

function toDbProductType(productType) {
  if (productType === 'BUNDLE') return 'SET'
  if (productType === 'VARIANT') return 'VARIANT'
  if (productType === 'SET') return 'SET'
  if (productType === 'INDIVIDUAL') return 'SET'
  return 'SET'
}

function sanitizeSubItems(subItems = []) {
  return subItems
    .filter((s) => String(s?.label ?? '').trim())
    .map((s, i) => ({
      label: String(s.label).trim(),
      price: Number(s.price ?? 0),
      position: i,
    }))
}

async function getKpis(req, res) {
  try {
    const bf = branchFilter(req.query)
    const cacheKey = `inventory:kpis:${req.query.branchId || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const [booksTotal, uniformsTotal] = await Promise.all([
      prisma.bookStock.aggregate({
        _sum: { quantity: true },
        where: {
          ...bf,
          item: { kit: { class: { grade: SUPPORTED_CLASS_GRADE } } },
        },
      }),
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
      where: {
        ...(bf.branchId ? { branchId: bf.branchId } : {}),
        grade: { gte: -2, lte: 10 },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      include: {
        bookKit: {
          include: {
            items: {
              where: { isArchived: false },
              include: {
                subItems: { where: { isActive: true }, orderBy: { position: 'asc' } },
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
          where: { isArchived: false },
          include: {
            subItems: { where: { isActive: true }, orderBy: { position: 'asc' } },
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
    const { branchId, quantity, notes, changeType = 'ADJUSTMENT' } = req.body
    if (!branchId || quantity === undefined) return badRequest(res, 'branchId and quantity are required')

    const existing = await prisma.bookStock.findUnique({
      where: { itemId_branchId: { itemId: req.params.kitId, branchId } },
    })

    const tone = calcTone(quantity)

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
          changeType,
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

// Bulk adjust multiple book items in one class at once — Super Admin only
async function bulkAdjustBookStock(req, res) {
  try {
    const { branchId, mode, reason, items } = req.body
    // items: [{ bookItemId, delta }]
    if (!branchId || !mode || !Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'branchId, mode, and items[] are required')
    }
    if ((mode === 'deduct' || mode === 'override') && !reason) {
      return badRequest(res, 'Reason is required for deduct and override modes')
    }

    const changeType = mode === 'override' ? 'ADJUSTMENT' : mode === 'deduct' ? 'OUTGOING' : 'INCOMING'

    const results = await prisma.$transaction(
      items.map(({ bookItemId, delta }) => {
        // We need current qty first — done outside transaction per item
        return prisma.bookStock.upsert({
          where: { itemId_branchId: { itemId: bookItemId, branchId } },
          create: { itemId: bookItemId, branchId, quantity: Math.max(delta, 0), tone: calcTone(Math.max(delta, 0)) },
          update: {},
        })
      }),
    )

    // Fetch current stocks then apply deltas
    const stockMap = {}
    const existing = await prisma.bookStock.findMany({
      where: { branchId, itemId: { in: items.map((i) => i.bookItemId) } },
    })
    existing.forEach((s) => { stockMap[s.itemId] = s.quantity })

    const updates = await Promise.all(
      items.map(async ({ bookItemId, delta }) => {
        const before = stockMap[bookItemId] ?? 0
        const after =
          mode === 'add' ? before + delta :
          mode === 'deduct' ? Math.max(before - delta, 0) :
          delta // override

        const tone = calcTone(after)

        const stock = await prisma.bookStock.upsert({
          where: { itemId_branchId: { itemId: bookItemId, branchId } },
          create: { itemId: bookItemId, branchId, quantity: after, tone },
          update: { quantity: after, tone },
        })

        await prisma.inventoryLog.create({
          data: {
            branchId,
            itemType: 'BOOK',
            bookItemId,
            changeType,
            quantityBefore: before,
            quantityAfter: after,
            quantityDelta: after - before,
            performedById: req.user.id,
            notes: reason || null,
          },
        })

        return { bookItemId, before, after, stock }
      }),
    )

    cache.delByPrefix('inventory:kpis')
    cache.delByPrefix(`branch:${branchId}`)
    return ok(res, updates)
  } catch (err) {
    console.error(err)
    return serverError(res)
  }
}

// ─── Product (BookKitItem) CRUD ───────────────────────────────────────────────

async function createProduct(req, res) {
  try {
    const {
      kitId,
      classGrade,
      label,
      icon,
      price,
      setPrice,
      productType,
      position,
      subItems,
      openingStocks = {},
      catalogKey: requestCatalogKey,
    } = req.body
    if (!label || price === undefined) return badRequest(res, 'label and price are required')

    let targetKits = []
    if (classGrade !== undefined && classGrade !== null) {
      const grade = Number(classGrade)
      if (!Number.isFinite(grade)) return badRequest(res, 'classGrade must be a number')
      const classes = await prisma.academicClass.findMany({
        where: { grade, section: 'A' },
        select: { id: true, branchId: true, bookKit: { select: { id: true } } },
        orderBy: { branchId: 'asc' },
      })
      targetKits = classes
        .filter((cls) => cls.bookKit?.id)
        .map((cls) => ({ kitId: cls.bookKit.id, branchId: cls.branchId }))
    } else if (kitId) {
      const kit = await prisma.bookKit.findUnique({
        where: { id: kitId },
        include: { class: { select: { grade: true } } },
      })
      if (!kit) return notFound(res, 'Kit not found')
      const classes = await prisma.academicClass.findMany({
        where: { grade: kit.class.grade, section: 'A' },
        select: { id: true, branchId: true, bookKit: { select: { id: true } } },
      })
      targetKits = classes
        .filter((cls) => cls.bookKit?.id)
        .map((cls) => ({ kitId: cls.bookKit.id, branchId: cls.branchId }))
    }
    if (!targetKits.length) return badRequest(res, 'No class kits found for this class')

    const created = await prisma.$transaction(async (tx) => {
      const catalogKey = requestCatalogKey || randomUUID()
      const payloadSubItems = sanitizeSubItems(subItems)
      const rows = []

      for (const target of targetKits) {
        const item = await tx.bookKitItem.create({
          data: {
            kitId: target.kitId,
            catalogKey,
            label: String(label).trim(),
            icon: icon ?? 'menu_book',
            price: Number(price),
            setPrice: setPrice != null && setPrice !== '' ? Number(setPrice) : null,
            productType: toDbProductType(productType),
            position: position ?? 0,
            subItems: payloadSubItems.length ? { create: payloadSubItems } : undefined,
          },
          include: { subItems: true },
        })

        const openingQty = Math.max(0, Number(openingStocks[target.branchId] ?? 0))
        await tx.bookStock.create({
          data: {
            itemId: item.id,
            branchId: target.branchId,
            quantity: openingQty,
            tone: calcTone(openingQty),
          },
        })
        await tx.inventoryLog.create({
          data: {
            branchId: target.branchId,
            itemType: 'BOOK',
            bookItemId: item.id,
            changeType: 'ADJUSTMENT',
            quantityBefore: 0,
            quantityAfter: openingQty,
            quantityDelta: openingQty,
            performedById: req.user.id,
            notes: OPENING_NOTES,
          },
        })

        rows.push(item)
      }
      return rows
    })
    cache.delByPrefix('inventory:books')
    cache.delByPrefix('inventory:kpis')
    return ok(res, created[0], 201)
  } catch {
    return serverError(res)
  }
}

async function updateProduct(req, res) {
  try {
    const { label, icon, price, setPrice, productType, position, subItems } = req.body
    const item = await prisma.bookKitItem.findUnique({ where: { id: req.params.itemId } })
    if (!item) return notFound(res, 'Product not found')

    const updated = await prisma.$transaction(async (tx) => {
      const targetIds = item.catalogKey
        ? (await tx.bookKitItem.findMany({ where: { catalogKey: item.catalogKey }, select: { id: true } })).map((r) => r.id)
        : [req.params.itemId]

      const payloadSubItems = subItems !== undefined ? sanitizeSubItems(subItems) : null
      for (const targetId of targetIds) {
        if (payloadSubItems !== null) {
          await tx.bookKitSubItem.deleteMany({ where: { kitItemId: targetId } })
          if (payloadSubItems.length) {
            await tx.bookKitSubItem.createMany({
              data: payloadSubItems.map((s) => ({ ...s, kitItemId: targetId })),
            })
          }
        }
        await tx.bookKitItem.update({
          where: { id: targetId },
          data: {
            ...(label !== undefined && { label }),
            ...(icon !== undefined && { icon }),
            ...(price !== undefined && { price: Number(price) }),
            ...(setPrice !== undefined && { setPrice: setPrice == null || setPrice === '' ? null : Number(setPrice) }),
            ...(productType !== undefined && { productType: toDbProductType(productType) }),
            ...(position !== undefined && { position }),
          },
        })
      }
      return tx.bookKitItem.findUnique({
        where: { id: req.params.itemId },
        include: { subItems: { where: { isActive: true }, orderBy: { position: 'asc' } } },
      })
    })

    cache.delByPrefix('inventory:books')
    return ok(res, updated)
  } catch {
    return serverError(res)
  }
}

async function archiveProduct(req, res) {
  try {
    const item = await prisma.bookKitItem.findUnique({ where: { id: req.params.itemId } })
    if (!item) return notFound(res, 'Product not found')
    if (item.catalogKey) {
      await prisma.bookKitItem.updateMany({ where: { catalogKey: item.catalogKey }, data: { isArchived: true } })
    } else {
      await prisma.bookKitItem.update({ where: { id: req.params.itemId }, data: { isArchived: true } })
    }
    cache.delByPrefix('inventory:books')
    return ok(res, { archived: true })
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
    const { branchId, quantity, notes, changeType = 'ADJUSTMENT' } = req.body
    if (!branchId || quantity === undefined) return badRequest(res, 'branchId and quantity are required')

    const size = await prisma.uniformSize.findUnique({ where: { id: req.params.sizeId } })
    if (!size) return notFound(res, 'Uniform size not found')

    const tone = calcTone(quantity, size.reorderThreshold)

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
          changeType,
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
    const { branchId } = req.query
    const cacheKey = `accessories:groups:${branchId || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const groups = await prisma.accessoryGroup.findMany({
      orderBy: { position: 'asc' },
      include: {
        accessories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            accessoryStocks: {
              where: branchId ? { branchId } : {},
              select: { quantity: true, tone: true, branchId: true },
            },
          },
        },
      },
    })
    cache.set(cacheKey, groups, cache.TTL.LONG)
    return ok(res, groups)
  } catch {
    return serverError(res)
  }
}

async function updateAccessoryStock(req, res) {
  try {
    const { branchId, quantity, notes, changeType = 'ADJUSTMENT' } = req.body
    if (!branchId || quantity === undefined) return badRequest(res, 'branchId and quantity are required')

    const accessory = await prisma.accessory.findUnique({ where: { id: req.params.accessoryId } })
    if (!accessory) return notFound(res, 'Accessory not found')

    const tone = calcTone(quantity, 20)

    const existing = await prisma.accessoryStock.findUnique({
      where: { accessoryId_branchId: { accessoryId: req.params.accessoryId, branchId } },
    })

    let stock
    if (existing) {
      const before = existing.quantity
      stock = await prisma.accessoryStock.update({
        where: { accessoryId_branchId: { accessoryId: req.params.accessoryId, branchId } },
        data: { quantity, tone },
      })
      await prisma.inventoryLog.create({
        data: {
          branchId,
          itemType: 'ACCESSORY',
          accessoryId: req.params.accessoryId,
          changeType,
          quantityBefore: before,
          quantityAfter: quantity,
          quantityDelta: quantity - before,
          performedById: req.user.id,
          notes,
        },
      })
    } else {
      stock = await prisma.accessoryStock.create({
        data: { accessoryId: req.params.accessoryId, branchId, quantity, tone },
      })
    }

    cache.delByPrefix('accessories:groups')
    return ok(res, stock)
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

module.exports = {
  getKpis,
  listBooks,
  getBookKit,
  updateBookStock,
  bulkAdjustBookStock,
  createProduct,
  updateProduct,
  archiveProduct,
  listUniformCategories,
  listUniforms,
  updateUniformStock,
  listAccessoryGroups,
  updateAccessoryStock,
  getLogs,
}
