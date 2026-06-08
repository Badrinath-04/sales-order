require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function tableExists(tableName) {
  const rows = await prisma.$queryRaw`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${tableName}
    ) as exists
  `
  return Boolean(rows[0]?.exists)
}

async function count(model, where = {}) {
  return prisma[model].count({ where })
}

async function main() {
  const physicalTables = [
    'UniformCategory',
    'UniformSize',
    'UniformStock',
    'BookKit',
    'BookKitItem',
    'BookStock',
    'Order',
    'OrderItem',
    'Transaction',
    'InventoryLog',
  ]

  console.log('schema_tables')
  for (const table of physicalTables) {
    console.log(`${table}: ${await tableExists(table) ? 'present' : 'missing'}`)
  }

  const [
    uniformCategories,
    uniformSizes,
    uniformStocks,
    bookItems,
    bookStocks,
    uniformOrderItems,
    bookOrderItems,
    mixedOrders,
    uniformLogs,
    bookLogs,
  ] = await Promise.all([
    count('uniformCategory'),
    count('uniformSize'),
    count('uniformStock'),
    count('bookKitItem'),
    count('bookStock'),
    count('orderItem', { itemType: 'UNIFORM' }),
    count('orderItem', { itemType: 'BOOK' }),
    prisma.order.count({
      where: {
        AND: [
          { items: { some: { itemType: 'BOOK' } } },
          { items: { some: { itemType: 'UNIFORM' } } },
        ],
      },
    }),
    count('inventoryLog', { itemType: 'UNIFORM' }),
    count('inventoryLog', { itemType: 'BOOK' }),
  ])

  console.log('row_counts')
  console.log(`uniform_categories: ${uniformCategories}`)
  console.log(`uniform_sizes: ${uniformSizes}`)
  console.log(`uniform_stock: ${uniformStocks}`)
  console.log(`book_items: ${bookItems}`)
  console.log(`book_stock: ${bookStocks}`)
  console.log(`uniform_order_items_shared_table: ${uniformOrderItems}`)
  console.log(`book_order_items_shared_table: ${bookOrderItems}`)
  console.log(`mixed_book_uniform_orders_shared_table: ${mixedOrders}`)
  console.log(`uniform_logs_shared_table: ${uniformLogs}`)
  console.log(`book_logs_shared_table: ${bookLogs}`)

  console.log('audit_result')
  console.log('catalog_and_stock_tables_are_separate: true')
  console.log('orders_transactions_logs_are_physical_separate_tables: false')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
