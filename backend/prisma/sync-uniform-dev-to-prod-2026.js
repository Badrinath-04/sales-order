require('dotenv').config()
const { randomUUID } = require('crypto')
const { PrismaClient } = require('@prisma/client')

const APPLY = process.argv.includes('--apply')

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL

if (!DEV_DATABASE_URL || !PROD_DATABASE_URL) {
  console.error('DEV_DATABASE_URL and PROD_DATABASE_URL are required.')
  process.exit(1)
}

const dev = new PrismaClient({ datasources: { db: { url: DEV_DATABASE_URL } } })
const prod = new PrismaClient({ datasources: { db: { url: PROD_DATABASE_URL } } })

const UNIFORM_TABLES = ['UniformCategory', 'UniformSize', 'UniformStock']
const GUARD_TABLES = ['Students', 'BookKitItem', 'BookStock', 'Order', 'OrderItem', 'Transaction', 'InventoryLog']

function calcTone(qty, threshold = 50) {
  const quantity = Number(qty ?? 0)
  const level = Number(threshold ?? 50)
  if (quantity <= level * 0.2) return 'CRITICAL'
  if (quantity <= level) return 'LOW'
  return 'NORMAL'
}

function branchKey(branch) {
  return String(branch?.code || branch?.name || '').trim().toLowerCase()
}

async function tableCounts(prisma, tables) {
  const out = {}
  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe(`select count(*)::int as count from "${table}"`)
    out[table] = Number(rows[0]?.count ?? 0)
  }
  return out
}

async function presentTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any($1)
  `, [...UNIFORM_TABLES, ...GUARD_TABLES])
  return new Set(rows.map((r) => r.table_name))
}

async function loadDevUniformData() {
  const categories = await dev.uniformCategory.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { label: 'asc' }],
    include: {
      sizes: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        include: {
          uniformStocks: {
            include: { branch: true },
            orderBy: { branch: { name: 'asc' } },
          },
        },
      },
    },
  })

  if (categories.length !== 7) {
    throw new Error(`Development uniform category count must be 7. Found ${categories.length}.`)
  }

  const sizeCount = categories.reduce((sum, category) => sum + category.sizes.length, 0)
  if (sizeCount === 0) throw new Error('Development uniform sizes are empty.')

  const stockRows = categories.flatMap((category) => category.sizes.flatMap((size) => size.uniformStocks))
  if (stockRows.length === 0) throw new Error('Development uniform stock is empty.')

  return categories
}

async function loadProdBranches() {
  const branches = await prod.branch.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      type: 'BRANCH',
    },
    select: { id: true, name: true, code: true },
  })

  const byKey = new Map()
  for (const branch of branches) {
    byKey.set(branchKey({ code: branch.code }), branch)
    byKey.set(branchKey({ name: branch.name }), branch)
  }
  return byKey
}

async function assertNoProdHistoryRefs() {
  const [orders] = await prod.$queryRawUnsafe(`
    select count(*)::int as count
    from "OrderItem"
    where "itemType" = 'UNIFORM'
      and "uniformSizeId" is not null
  `)
  const [logs] = await prod.$queryRawUnsafe(`
    select count(*)::int as count
    from "InventoryLog"
    where "itemType" = 'UNIFORM'
      and "uniformSizeId" is not null
  `)

  if (Number(orders.count) > 0 || Number(logs.count) > 0) {
    throw new Error(
      `Production has uniform history references (orderItems=${orders.count}, logs=${logs.count}). Refusing to replace catalog.`,
    )
  }
}

function printSourceMatrix(categories) {
  console.log('\nDevelopment uniform source matrix')
  for (const category of categories) {
    console.log(`\n${category.position}. ${category.label} (${category.name}) icon=${category.icon}`)
    for (const size of category.sizes) {
      const branchStocks = size.uniformStocks
        .map((stock) => `${stock.branch.name}:${stock.quantity}`)
        .join(' | ')
      const total = size.uniformStocks.reduce((sum, stock) => sum + Number(stock.quantity ?? 0), 0)
      console.log(
        `  ${size.position}. code=${size.code} name=${size.name} price=${size.price} threshold=${size.reorderThreshold} total=${total} :: ${branchStocks}`,
      )
    }
  }
}

async function replaceProdUniformData(categories) {
  const prodBranches = await loadProdBranches()
  const categoryRows = []
  const sizeRows = []
  const stockRows = []

  for (const category of categories) {
    const categoryId = randomUUID()
    categoryRows.push({
      id: categoryId,
      name: category.name,
      label: category.label,
      icon: category.icon,
      position: category.position,
      isActive: category.isActive,
      createdAt: category.createdAt,
    })

    for (const size of category.sizes) {
      const sizeId = randomUUID()
      sizeRows.push({
        id: sizeId,
        categoryId,
        code: size.code,
        name: size.name,
        price: size.price,
        reorderThreshold: size.reorderThreshold,
        position: size.position,
        createdAt: size.createdAt,
        updatedAt: size.updatedAt,
      })

      for (const stock of size.uniformStocks) {
        const targetBranch = prodBranches.get(branchKey(stock.branch))
        if (!targetBranch) {
          throw new Error(`No matching production branch for dev branch ${stock.branch.name} (${stock.branch.code}).`)
        }

        stockRows.push({
          id: randomUUID(),
          sizeId,
          branchId: targetBranch.id,
          quantity: stock.quantity,
          reserved: stock.reserved,
          tone: calcTone(stock.quantity, size.reorderThreshold),
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt,
        })
      }
    }
  }

  await prod.$transaction(async (tx) => {
    await tx.uniformStock.deleteMany({})
    await tx.uniformSize.deleteMany({})
    await tx.uniformCategory.deleteMany({})
    await tx.uniformCategory.createMany({ data: categoryRows })
    await tx.uniformSize.createMany({ data: sizeRows })
    await tx.uniformStock.createMany({ data: stockRows })
  }, { timeout: 30000, maxWait: 10000 })
}

async function verifyProdMatches(categories) {
  const expected = new Map()
  for (const category of categories) {
    for (const size of category.sizes) {
      for (const stock of size.uniformStocks) {
        expected.set(
          `${category.name}|${size.code}|${branchKey(stock.branch)}`,
          {
            label: category.label,
            size: size.name,
            price: String(size.price),
            quantity: Number(stock.quantity ?? 0),
          },
        )
      }
    }
  }

  const rows = await prod.$queryRawUnsafe(`
    select c.name as category_name, c.label as category_label, s.code, s.name as size_name,
           s.price::text as price, b.name as branch_name, b.code as branch_code, us.quantity
    from "UniformCategory" c
    join "UniformSize" s on s."categoryId" = c.id
    join "UniformStock" us on us."sizeId" = s.id
    join "Branch" b on b.id = us."branchId"
    order by c.position, s.position, b.name
  `)

  const mismatches = []
  for (const row of rows) {
    const expectedRow = expected.get(`${row.category_name}|${row.code}|${branchKey({ code: row.branch_code })}`)
    if (!expectedRow) {
      mismatches.push(`Unexpected prod row ${row.category_name}/${row.code}/${row.branch_name}`)
      continue
    }
    if (Number(row.price) !== Number(expectedRow.price) || Number(row.quantity) !== expectedRow.quantity) {
      mismatches.push(
        `Mismatch ${row.category_label}/${row.size_name}/${row.branch_name}: price ${row.price} vs ${expectedRow.price}, qty ${row.quantity} vs ${expectedRow.quantity}`,
      )
    }
    expected.delete(`${row.category_name}|${row.code}|${branchKey({ code: row.branch_code })}`)
  }

  for (const row of expected.values()) {
    mismatches.push(`Missing prod row ${row.label}/${row.size}`)
  }

  if (mismatches.length) {
    throw new Error(`Production verification failed:\n${mismatches.join('\n')}`)
  }
}

async function branchTotals(prisma) {
  return prisma.$queryRawUnsafe(`
    select b.name as branch, count(us.id)::int as rows, coalesce(sum(us.quantity), 0)::int as quantity
    from "UniformStock" us
    join "Branch" b on b.id = us."branchId"
    group by b.name
    order by b.name
  `)
}

async function main() {
  const devTables = await presentTables(dev)
  const prodTables = await presentTables(prod)
  for (const table of UNIFORM_TABLES) {
    if (!devTables.has(table)) throw new Error(`Development table missing: ${table}`)
    if (!prodTables.has(table)) throw new Error(`Production table missing: ${table}. Refusing to run broad migration.`)
  }

  const beforeGuardCounts = await tableCounts(prod, GUARD_TABLES)
  const beforeUniformCounts = await tableCounts(prod, UNIFORM_TABLES)
  const categories = await loadDevUniformData()
  printSourceMatrix(categories)

  console.log('\nProduction pre-check')
  console.log('guard_counts_before:', JSON.stringify(beforeGuardCounts))
  console.log('uniform_counts_before:', JSON.stringify(beforeUniformCounts))
  console.log('uniform_branch_totals_before:', JSON.stringify(await branchTotals(prod)))

  await assertNoProdHistoryRefs()

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to replace production uniform catalog/stock.')
    return
  }

  await replaceProdUniformData(categories)
  await verifyProdMatches(categories)

  const afterGuardCounts = await tableCounts(prod, GUARD_TABLES)
  const afterUniformCounts = await tableCounts(prod, UNIFORM_TABLES)
  console.log('\nProduction post-check')
  console.log('guard_counts_after:', JSON.stringify(afterGuardCounts))
  console.log('uniform_counts_after:', JSON.stringify(afterUniformCounts))
  console.log('uniform_branch_totals_after:', JSON.stringify(await branchTotals(prod)))

  const changedGuards = Object.keys(beforeGuardCounts)
    .filter((table) => beforeGuardCounts[table] !== afterGuardCounts[table])
  if (changedGuards.length) {
    throw new Error(`Guard table counts changed unexpectedly: ${changedGuards.join(', ')}`)
  }

  console.log('\nUniform dev -> prod sync completed successfully.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await dev.$disconnect()
    await prod.$disconnect()
  })
