require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const BRANCH_ALIASES = {
  darga: ['NHS_DARGA', 'CAMP-A', 'DARGA'],
  shaikpet: ['NS_SHAIKPET', 'CAMP-C', 'SHAIKPET'],
  narsingi: ['SVN_NARSINGI', 'CAMP-B', 'NARSINGI'],
}

const CATEGORY_ALIASES = {
  t_shirt: ['t_shirt', 'shirt', 'tshirt'],
  skirt: ['skirt'],
  shorts: ['shorts'],
  pant: ['pant', 'trouser', 'trousers'],
  tie: ['tie'],
  belt: ['belt'],
  socks: ['socks', 'sock'],
}

const T_SHIRT_STOCK_DARGA = {
  20: 3,
  22: 15,
  24: 12,
  26: 15,
  28: 13,
  30: 13,
  32: 13,
  34: 9,
  36: 12,
  38: 8,
  40: 8,
  42: 1,
}

const SKIRT_STOCK_DARGA = {
  15: 18,
  16: 2,
  17: 1,
  18: 3,
  20: 17,
  22: 26,
  24: 22,
  26: 16,
  28: 9,
  30: 1,
}

const SHORTS_STOCK_DARGA = {
  11: 14,
  12: 10,
  13: 13,
  14: 8,
  15: 10,
  16: 2,
  17: 11,
}

const PANT_STOCK_DARGA = {
  28: 29,
  30: 14,
  32: 14,
  34: 14,
  36: 12,
  38: 19,
  40: 0,
  42: 5,
}

const T_SHIRT_PRICES = {
  20: 330,
  22: 350,
  24: 370,
  26: 390,
  28: 410,
  30: 430,
  32: 450,
  34: 470,
  36: 490,
  38: 510,
  40: 530,
  42: 550,
}

function numericPrices(codes) {
  return codes.reduce((acc, code, idx) => {
    acc[code] = Math.min(400, 200 + idx * 20)
    return acc
  }, {})
}

const CATEGORY_DATA = [
  {
    name: 't_shirt',
    label: 'T-Shirt',
    icon: 'checkroom',
    sizePrefix: 'Chest',
    stocks: T_SHIRT_STOCK_DARGA,
    prices: T_SHIRT_PRICES,
    threshold: 20,
  },
  {
    name: 'skirt',
    label: 'Skirt',
    icon: 'woman',
    sizePrefix: 'Waist',
    stocks: SKIRT_STOCK_DARGA,
    prices: numericPrices(Object.keys(SKIRT_STOCK_DARGA)),
    threshold: 20,
  },
  {
    name: 'shorts',
    label: 'Shorts',
    icon: 'dry_cleaning',
    sizePrefix: 'Size',
    stocks: SHORTS_STOCK_DARGA,
    prices: numericPrices(Object.keys(SHORTS_STOCK_DARGA)),
    threshold: 20,
  },
  {
    name: 'pant',
    label: 'Pant',
    icon: 'line_weight',
    sizePrefix: 'Waist',
    stocks: PANT_STOCK_DARGA,
    prices: numericPrices(Object.keys(PANT_STOCK_DARGA)),
    threshold: 20,
  },
  {
    name: 'tie',
    label: 'Tie',
    icon: 'style',
    universal: true,
    stocks: { ONE: 0 },
    prices: { ONE: 80 },
    threshold: 20,
  },
  {
    name: 'belt',
    label: 'Belt',
    icon: 'straighten',
    universal: true,
    stocks: { ONE: 0 },
    prices: { ONE: 100 },
    threshold: 20,
  },
  {
    name: 'socks',
    label: 'Socks',
    icon: 'footprint',
    stocks: { S: 0, M: 0, L: 0 },
    names: { S: 'Small', M: 'Medium', L: 'Large' },
    prices: { S: 50, M: 55, L: 60 },
    threshold: 20,
  },
]

function calcTone(qty, threshold = 20) {
  if (qty <= threshold * 0.2) return 'CRITICAL'
  if (qty <= threshold) return 'LOW'
  return 'NORMAL'
}

function branchStockFor(category, branchKey, code) {
  if (branchKey === 'darga') {
    const qty = Number(category.stocks[code] ?? 0)
    return qty === 0 ? 50 : qty
  }
  if (branchKey === 'shaikpet') return 50
  if (branchKey === 'narsingi') return 50
  return 0
}

async function findBranch(branchKey) {
  const aliases = BRANCH_ALIASES[branchKey]
  const branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { code: { in: aliases } },
        { name: { contains: branchKey, mode: 'insensitive' } },
      ],
      isActive: true,
      deletedAt: null,
      type: 'BRANCH',
    },
  })
  if (!branch) throw new Error(`Branch not found for ${branchKey}`)
  return branch
}

async function findCategory(name) {
  const aliases = CATEGORY_ALIASES[name] ?? [name]
  return prisma.uniformCategory.findFirst({
    where: {
      OR: [
        { name: { in: aliases } },
        { label: { in: aliases.map((alias) => alias.replace(/_/g, ' ')) } },
      ],
    },
  })
}

async function upsertCategory(category, position) {
  const existing = await findCategory(category.name)
  if (existing) {
    return prisma.uniformCategory.update({
      where: { id: existing.id },
      data: {
        name: category.name,
        label: category.label,
        icon: category.icon,
        position,
        isActive: true,
      },
    })
  }

  return prisma.uniformCategory.create({
    data: {
      name: category.name,
      label: category.label,
      icon: category.icon,
      position,
      isActive: true,
    },
  })
}

async function main() {
  console.log('Seeding 2026 uniform categories, prices, and stock...')
  const branches = {
    darga: await findBranch('darga'),
    shaikpet: await findBranch('shaikpet'),
    narsingi: await findBranch('narsingi'),
  }

  for (let position = 0; position < CATEGORY_DATA.length; position += 1) {
    const category = CATEGORY_DATA[position]
    const cat = await upsertCategory(category, position)
    const codes = Object.keys(category.prices)

    const existingSizes = await prisma.uniformSize.findMany({
      where: { categoryId: cat.id },
      select: { id: true, code: true },
    })
    const keepCodes = new Set(codes)
    const removeIds = existingSizes.filter((s) => !keepCodes.has(s.code)).map((s) => s.id)

    if (removeIds.length) {
      await prisma.inventoryLog.deleteMany({ where: { uniformSizeId: { in: removeIds } } })
      await prisma.uniformStock.deleteMany({ where: { sizeId: { in: removeIds } } })
      await prisma.uniformSize.deleteMany({ where: { id: { in: removeIds } } })
    }

    for (let idx = 0; idx < codes.length; idx += 1) {
      const code = codes[idx]
      const name = category.universal
        ? 'One Size'
        : category.names?.[code] ?? `${category.sizePrefix} ${code}`

      const size = await prisma.uniformSize.upsert({
        where: { categoryId_code: { categoryId: cat.id, code } },
        update: {
          name,
          price: category.prices[code],
          reorderThreshold: category.threshold,
          position: idx,
        },
        create: {
          categoryId: cat.id,
          code,
          name,
          price: category.prices[code],
          reorderThreshold: category.threshold,
          position: idx,
        },
      })

      for (const [branchKey, branch] of Object.entries(branches)) {
        const qty = branchStockFor(category, branchKey, code)
        await prisma.uniformStock.upsert({
          where: { sizeId_branchId: { sizeId: size.id, branchId: branch.id } },
          update: { quantity: qty, tone: calcTone(qty, category.threshold) },
          create: {
            sizeId: size.id,
            branchId: branch.id,
            quantity: qty,
            tone: calcTone(qty, category.threshold),
          },
        })
      }
    }
  }

  const totals = await prisma.uniformStock.aggregate({ _sum: { quantity: true } })
  const categories = await prisma.uniformCategory.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    select: { label: true },
  })
  console.log(`Uniform categories: ${categories.map((c) => c.label).join(', ')}`)
  console.log(`Uniform stock total: ${Number(totals._sum.quantity ?? 0).toLocaleString('en-IN')} units`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
