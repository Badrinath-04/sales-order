const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { status, fromBranchId, toBranchId } = req.query
    const where = {}
    if (status) where.status = status
    if (fromBranchId) where.fromBranchId = fromBranchId
    if (toBranchId) where.toBranchId = toBranchId

    const [total, transfers] = await Promise.all([
      prisma.stockTransfer.count({ where }),
      prisma.stockTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromBranch: { select: { name: true, code: true } },
          toBranch: { select: { name: true, code: true } },
          transferredBy: { select: { displayName: true } },
          _count: { select: { items: true } },
        },
      }),
    ])
    return ok(res, transfers, buildMeta(total, page, limit))
  } catch {
    return serverError(res)
  }
}

async function create(req, res) {
  try {
    const { fromBranchId, toBranchId, notes, items } = req.body
    if (!fromBranchId || !toBranchId || !items?.length) {
      return badRequest(res, 'fromBranchId, toBranchId, and items are required')
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.stockTransfer.create({
        data: {
          fromBranchId,
          toBranchId,
          transferredById: req.user.id,
          notes,
          items: {
            create: items.map((item) => ({
              itemType: item.itemType,
              bookItemId: item.itemType === 'BOOK' ? item.itemId : null,
              uniformSizeId: item.itemType === 'UNIFORM' ? item.itemId : null,
              accessoryId: item.itemType === 'ACCESSORY' ? item.itemId : null,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      })
      return t
    })

    cache.delByPrefix('inventory:kpis')
    return created(res, transfer)
  } catch {
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: req.params.id },
      include: {
        fromBranch: true,
        toBranch: true,
        transferredBy: { select: { displayName: true, username: true } },
        items: {
          include: {
            bookItem: { include: { kit: { include: { class: true } } } },
            uniformSize: { include: { category: true } },
            accessory: { include: { group: true } },
          },
        },
      },
    })
    if (!transfer) return notFound(res, 'Transfer not found')
    return ok(res, transfer)
  } catch {
    return serverError(res)
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body
    const allowed = ['IN_TRANSIT', 'COMPLETED', 'CANCELLED']
    if (!allowed.includes(status)) return badRequest(res, `status must be one of: ${allowed.join(', ')}`)

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.stockTransfer.update({
        where: { id: req.params.id },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
        include: { items: true },
      })

      // When completed: deduct from source branch, add to destination
      if (status === 'COMPLETED') {
        for (const item of t.items) {
          if (item.itemType === 'BOOK' && item.bookItemId) {
            await tx.bookStock.updateMany({
              where: { itemId: item.bookItemId, branchId: t.fromBranchId },
              data: { quantity: { decrement: item.quantity } },
            })
            await tx.bookStock.upsert({
              where: { itemId_branchId: { itemId: item.bookItemId, branchId: t.toBranchId } },
              update: { quantity: { increment: item.quantity } },
              create: { itemId: item.bookItemId, branchId: t.toBranchId, quantity: item.quantity },
            })
          } else if (item.itemType === 'UNIFORM' && item.uniformSizeId) {
            await tx.uniformStock.updateMany({
              where: { sizeId: item.uniformSizeId, branchId: t.fromBranchId },
              data: { quantity: { decrement: item.quantity } },
            })
            await tx.uniformStock.upsert({
              where: { sizeId_branchId: { sizeId: item.uniformSizeId, branchId: t.toBranchId } },
              update: { quantity: { increment: item.quantity } },
              create: { sizeId: item.uniformSizeId, branchId: t.toBranchId, quantity: item.quantity },
            })
          } else if (item.itemType === 'ACCESSORY' && item.accessoryId) {
            await tx.accessoryStock.updateMany({
              where: { accessoryId: item.accessoryId, branchId: t.fromBranchId },
              data: { quantity: { decrement: item.quantity } },
            })
            await tx.accessoryStock.upsert({
              where: { accessoryId_branchId: { accessoryId: item.accessoryId, branchId: t.toBranchId } },
              update: { quantity: { increment: item.quantity } },
              create: { accessoryId: item.accessoryId, branchId: t.toBranchId, quantity: item.quantity },
            })
          }
        }
        await tx.inventoryLog.createMany({
          data: t.items.map((item) => ({
            branchId: t.toBranchId,
            itemType: item.itemType,
            bookItemId: item.bookItemId,
            uniformSizeId: item.uniformSizeId,
            accessoryId: item.accessoryId,
            changeType: 'TRANSFER_IN',
            quantityBefore: 0,
            quantityAfter: item.quantity,
            quantityDelta: item.quantity,
            performedById: req.user.id,
            notes: `Transfer ${t.referenceId} completed`,
          })),
        })
      }

      return t
    })

    cache.delByPrefix('inventory:kpis')
    return ok(res, transfer)
  } catch {
    return serverError(res)
  }
}

module.exports = { list, create, getOne, updateStatus }
