const prisma = require('../../services/prisma')
const cache = require('../../services/cache')
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response')
const { parsePagination, buildMeta } = require('../../utils/pagination')
const { OPERATIONAL_BRANCH_FILTER } = require('../../utils/operationalBranch')

const SUPPORTED_CLASS_GRADE = { gte: -2, lte: 10 }

/** Prisma default interactive tx timeout is 5s — order create runs many stock/log writes and often exceeds that on serverless + remote DB. */
const ORDER_TX_OPTIONS = { maxWait: 15_000, timeout: 60_000 }

function genOrderId() {
  const now = new Date()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `#SKM-${now.getFullYear()}-${rand}`
}

function normalizeOrderItemSet(items) {
  return (items ?? [])
    .map((item) => ({
      itemType: item.itemType,
      key: item.bookItemId || item.uniformSizeId || item.accessoryId || item.itemId || item.label,
      quantity: Number(item.quantity || 1),
    }))
    .sort((a, b) => `${a.itemType}:${a.key}`.localeCompare(`${b.itemType}:${b.key}`))
}

function calcStockTone(qty, threshold = 50) {
  if (qty <= threshold * 0.2) return 'CRITICAL'
  if (qty <= threshold) return 'LOW'
  return 'NORMAL'
}

function buildDistributionLogNotes({
  studentName,
  rollNumber,
  classLabel,
  section,
  branchName,
  productName,
  quantityDelta,
}) {
  return [
    'Distribution',
    `Student: ${studentName}`,
    `Roll: ${rollNumber}`,
    `Class: ${classLabel} Section ${section}`,
    `Branch: ${branchName}`,
    `Product: ${productName}`,
    `Quantity: ${quantityDelta}`,
  ].join('\n')
}

/**
 * Decrement branch stock per aggregated order lines; write DISTRIBUTION inventory logs.
 * @returns {string[]} human-readable warnings when stock hits 0 after deduction
 */
async function applyOrderStockDeductions(tx, {
  branchId,
  orderItems,
  student,
  branchName,
  performedById,
}) {
  const warnings = []
  const classLabel = student.class?.label ?? '—'
  const section = student.class?.section ?? '—'
  const rollNumber = student.rollNumber ?? '—'
  const studentName = student.name ?? '—'

  const bookDeltas = new Map()
  const uniformDeltas = new Map()
  for (const line of orderItems) {
    const qty = Math.max(0, Math.floor(Number(line.quantity ?? 1)))
    if (line.itemType === 'BOOK' && line.bookItemId) {
      bookDeltas.set(line.bookItemId, (bookDeltas.get(line.bookItemId) ?? 0) + qty)
    } else if (line.itemType === 'UNIFORM' && line.uniformSizeId) {
      uniformDeltas.set(line.uniformSizeId, (uniformDeltas.get(line.uniformSizeId) ?? 0) + qty)
    }
  }

  for (const [bookItemId, deduct] of bookDeltas) {
    const labelRow = await tx.bookKitItem.findUnique({
      where: { id: bookItemId },
      select: { label: true },
    })
    const productName = labelRow?.label ?? bookItemId

    const stock = await tx.bookStock.findUnique({
      where: { itemId_branchId: { itemId: bookItemId, branchId } },
    })
    const before = stock?.quantity ?? 0
    const after = Math.max(0, before - deduct)
    const quantityDelta = after - before

    if (before <= deduct) {
      warnings.push(
        `Stock for ${productName} is now at 0 at ${branchName}. Please replenish.`,
      )
    }

    const tone = calcStockTone(after)
    await tx.bookStock.upsert({
      where: { itemId_branchId: { itemId: bookItemId, branchId } },
      create: { itemId: bookItemId, branchId, quantity: after, tone },
      update: { quantity: after, tone },
    })

    await tx.inventoryLog.create({
      data: {
        branchId,
        itemType: 'BOOK',
        bookItemId,
        // Use enum value supported by current Prisma client for stock deduction entries.
        changeType: 'OUTGOING',
        quantityBefore: before,
        quantityAfter: after,
        quantityDelta,
        performedById,
        notes: buildDistributionLogNotes({
          studentName,
          rollNumber,
          classLabel,
          section,
          branchName,
          productName,
          quantityDelta,
        }),
      },
    })
  }

  for (const [uniformSizeId, deduct] of uniformDeltas) {
    const sz = await tx.uniformSize.findUnique({
      where: { id: uniformSizeId },
      select: { name: true, code: true },
    })
    const productName = sz ? `${sz.name} (${sz.code})` : uniformSizeId

    const stock = await tx.uniformStock.findUnique({
      where: { sizeId_branchId: { sizeId: uniformSizeId, branchId } },
    })
    const before = stock?.quantity ?? 0
    const after = Math.max(0, before - deduct)
    const quantityDelta = after - before

    if (before <= deduct) {
      warnings.push(
        `Stock for ${productName} is now at 0 at ${branchName}. Please replenish.`,
      )
    }

    const tone = calcStockTone(after)
    await tx.uniformStock.upsert({
      where: { sizeId_branchId: { sizeId: uniformSizeId, branchId } },
      create: { sizeId: uniformSizeId, branchId, quantity: after, tone },
      update: { quantity: after, tone },
    })

    await tx.inventoryLog.create({
      data: {
        branchId,
        itemType: 'UNIFORM',
        uniformSizeId,
        // Use enum value supported by current Prisma client for stock deduction entries.
        changeType: 'OUTGOING',
        quantityBefore: before,
        quantityAfter: after,
        quantityDelta,
        performedById,
        notes: buildDistributionLogNotes({
          studentName,
          rollNumber,
          classLabel,
          section,
          branchName,
          productName,
          quantityDelta,
        }),
      },
    })
  }

  return [...new Set(warnings)]
}

async function list(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { branchId, paymentStatus, status, search, dateFrom, dateTo } = req.query

    const where = {
      student: { class: { grade: SUPPORTED_CLASS_GRADE } },
    }
    if (branchId) where.branchId = branchId
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { name: true, rollNumber: true, initials: true } },
          branch: { select: { name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
    ])
    return ok(res, orders, buildMeta(total, page, limit))
  } catch {
    return serverError(res)
  }
}

async function create(req, res) {
  try {
    const { studentId, branchId, items, notes, discountAmount = 0 } = req.body
    if (!studentId || !branchId || !items?.length) {
      return badRequest(res, 'studentId, branchId, and items are required')
    }

    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: { class: { select: { grade: true, section: true, label: true } } },
    })
    if (!student) return badRequest(res, 'Student not found')
    if (student.class.grade < -2 || student.class.grade > 10) {
      return badRequest(res, 'Orders are only supported for Nursery, LKG, UKG, and Class 1-10')
    }

    const branchRow = await prisma.branch.findFirst({
      where: { id: branchId, ...OPERATIONAL_BRANCH_FILTER },
      select: { name: true },
    })
    if (!branchRow) return badRequest(res, 'Invalid or inactive branch')
    const branchName = branchRow.name

    const result = await prisma.$transaction(async (tx) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const requestedSet = normalizeOrderItemSet(items)
      const existingToday = await tx.order.findMany({
        where: {
          studentId,
          createdAt: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
        include: {
          items: {
            select: {
              itemType: true,
              bookItemId: true,
              uniformSizeId: true,
              accessoryId: true,
              quantity: true,
              label: true,
            },
          },
        },
      })
      const duplicate = existingToday.find((existingOrder) => {
        const existingSet = normalizeOrderItemSet(existingOrder.items)
        return JSON.stringify(existingSet) === JSON.stringify(requestedSet)
      })
      if (duplicate) {
        throw new Error(`DUPLICATE_ORDER:${duplicate.orderId}`)
      }

      let subtotal = 0
      const itemsData = items.map((item) => {
        const lineTotal = item.unitPrice * item.quantity
        subtotal += lineTotal
        return {
          itemType: item.itemType,
          bookItemId: item.itemType === 'BOOK' ? item.itemId : null,
          uniformSizeId: item.itemType === 'UNIFORM' ? item.itemId : null,
          accessoryId: item.itemType === 'ACCESSORY' ? item.itemId : null,
          label: item.label,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal,
        }
      })

      const adminFee = 0
      const discount = Math.max(0, Number(discountAmount) || 0)
      const total = Math.max(0, subtotal + adminFee - discount)

      const classData = await tx.students.findUnique({
        where: { id: studentId },
        include: {
          class: {
            include: {
              bookKit: {
                include: {
                  items: {
                    where: { isArchived: false },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      })
      const totalClassProducts = classData?.class?.bookKit?.items?.length ?? 0
      const selectedBookProducts = new Set(itemsData.filter((i) => i.itemType === 'BOOK').map((i) => i.bookItemId)).size
      const bookStatus =
        selectedBookProducts === 0 ? 'NOT_TAKEN'
          : (totalClassProducts > 0 && selectedBookProducts >= totalClassProducts ? 'TAKEN' : 'PARTIAL')

      const order = await tx.order.create({
        data: {
          orderId: genOrderId(),
          studentId,
          branchId,
          createdById: req.user.id,
          subtotal,
          administrativeFee: adminFee,
          total,
          bookStatus,
          notes: [notes, discount > 0 ? `Discount Applied: ₹${discount.toFixed(2)}` : null].filter(Boolean).join('\n') || undefined,
          items: { create: itemsData },
        },
        include: {
          items: true,
          student: { include: { class: { select: { grade: true, section: true, label: true } } } },
        },
      })

      const stockWarnings = await applyOrderStockDeductions(tx, {
        branchId,
        orderItems: order.items,
        student: order.student,
        branchName,
        performedById: req.user.id,
      })

      return { order, stockWarnings }
    }, ORDER_TX_OPTIONS)

    cache.delByPrefix(`branch:${branchId}`)
    cache.delByPrefix('inventory:kpis')
    return created(res, { order: result.order, stockWarnings: result.stockWarnings })
  } catch (err) {
    if (err?.message?.startsWith('DUPLICATE_ORDER:')) {
      const existingOrderId = err.message.split('DUPLICATE_ORDER:')[1]
      return badRequest(res, `An order with the same items already exists today (${existingOrderId}).`, [{
        code: 'DUPLICATE_ORDER',
        existingOrderId,
      }])
    }
    if (err?.code === 'P2028') {
      return res.status(503).json({
        success: false,
        message: 'Database took too long to respond. Please try again.',
      })
    }
    console.error('[orders.create]', err?.code, err?.message)
    return serverError(res)
  }
}

async function getOne(req, res) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, student: { class: { grade: SUPPORTED_CLASS_GRADE } } },
      include: {
        student: { include: { class: true } },
        branch: true,
        createdBy: { select: { displayName: true } },
        items: {
          include: {
            bookItem: { include: { kit: { include: { class: true } } } },
            uniformSize: { include: { category: true } },
            accessory: { include: { group: true } },
          },
        },
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!order) return notFound(res, 'Order not found')
    return ok(res, order)
  } catch {
    return serverError(res)
  }
}

async function update(req, res) {
  try {
    const { status, bookStatus, uniformStatus, notes } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, bookStatus, uniformStatus, notes },
    })
    return ok(res, order)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Order not found')
    return serverError(res)
  }
}

async function processPayment(req, res) {
  try {
    const { amount, paymentMethod, referenceId, notes } = req.body
    if (!amount || !paymentMethod) return badRequest(res, 'amount and paymentMethod are required')

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) return notFound(res, 'Order not found')
    if (order.paymentStatus === 'PAID') {
      return badRequest(res, 'Payment is already completed for this order')
    }

    const result = await prisma.$transaction(async (tx) => {
      const isCredit = paymentMethod === 'CREDIT'
      const paymentAmount = Number(amount)
      const paidIncrement = isCredit ? 0 : paymentAmount
      const newPaid = Number(order.paidAmount) + paidIncrement
      const totalAmount = Number(order.total)
      const paymentStatus =
        newPaid >= totalAmount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID'
      const txStatus = isCredit
        ? 'PARTIAL'
        : (paymentStatus === 'PAID' ? 'PAID' : 'PARTIAL')

      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          branchId: order.branchId,
          amount,
          paymentMethod,
          status: txStatus,
          referenceId,
          notes,
          paidAt: new Date(),
        },
      })

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: newPaid,
          paymentStatus,
          paymentMethod,
          referenceId,
          paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
          status: paymentStatus === 'PAID' ? 'COMPLETED' : 'PROCESSING',
        },
        include: { student: true, branch: true, items: true },
      })

      return { order: updated, transaction }
    }, ORDER_TX_OPTIONS)

    cache.delByPrefix(`branch:${order.branchId}`)
    cache.delByPrefix('inventory:kpis')
    cache.delByPrefix('reports')
    return ok(res, result)
  } catch {
    return serverError(res)
  }
}

async function cancel(req, res) {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })
    return ok(res, order)
  } catch (err) {
    if (err.code === 'P2025') return notFound(res, 'Order not found')
    return serverError(res)
  }
}

module.exports = { list, create, getOne, update, processPayment, cancel }
