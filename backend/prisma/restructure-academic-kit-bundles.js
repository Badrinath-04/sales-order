const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const BRANCH_CODES = ['NHS_DARGA', 'NS_SHAIKPET', 'SVN_NARSINGI']
const GOV_TEXTBOOK_TOTALS = {
  6: 730,
  7: 810,
  8: 980,
  9: 1010,
}

const PRIMARY_ZERO_SUBITEMS = {
  4: [
    { label: 'English - Grammar', position: 6 },
    { label: 'Mathematics - Text book Opas', position: 8 },
    { label: 'EVS - Opas', position: 9 },
    { label: 'Science - Blue Duck / Navneeth', position: 10 },
    { label: 'Social - Blue Duck / Navneeth', position: 11 },
  ],
  5: [
    { label: 'English - Grammar', position: 6 },
    { label: 'Mathematics - Text book Opas', position: 8 },
    { label: 'EVS - Opas', position: 9 },
    { label: 'Science - Blue Duck / Navneeth', position: 10 },
    { label: 'Social - Blue Duck / Navneeth', position: 11 },
  ],
}

const WORKBOOK_ZERO_SUBITEMS = {
  9: [
    { label: 'General Knowledge - Pranavi', position: 12 },
  ],
  10: [
    { label: 'Eng. Grammar - Glorious English Grammar', position: 3 },
    { label: 'Vedic Math - Vedic Math', position: 11 },
    { label: 'General Knowledge - Pranavi', position: 12 },
    { label: 'Computer - Login 3.0', position: 13 },
  ],
}

const PRIMARY_ZERO_STOCK = {
  NHS_DARGA: { 4: 70, 5: 80 },
  NS_SHAIKPET: { 4: 75, 5: 70 },
  SVN_NARSINGI: { 4: 65, 5: 65 },
}

const HIGH_SCHOOL_ZERO_STOCK = {
  NHS_DARGA: { 9: 90, 10: 60 },
  NS_SHAIKPET: { 9: 40, 10: 40 },
  SVN_NARSINGI: { 9: 40, 10: 30 },
}

const COMBINED_SET_EXPANSIONS = [
  {
    match: /navneeth\s+lkg\s+combined\s+set/i,
    items: [
      'Literacy',
      'Numeracy',
      'General Awareness',
      'Art & Craft',
      'Phonix',
      'Phoenics',
      'Rhymes & Stories',
      'All in one practice book',
      '50+50 Flash cards',
      'Diy Kit',
    ],
  },
  {
    match: /rockland\s+ukg\s+combined\s+set/i,
    items: [
      'Course Book 1 & 2',
      'Activity 1 & 2',
      'Rhymes & Stories',
      'Art & Colour',
    ],
  },
]

function roundUpToFive(value) {
  return Math.ceil((Number(value) || 0) / 5) * 5
}

function bundleGroupsForGrade(grade) {
  if (grade >= 6) {
    return [
      {
        key: `academic_textbooks_g${grade}`,
        label: 'Textbook Bundle',
        icon: 'menu_book',
        setPrice: GOV_TEXTBOOK_TOTALS[grade],
        match: (item) => String(item.catalogKey || '').startsWith(`gov_textbook_g${grade}_`),
      },
      {
        key: `academic_workbooks_g${grade}`,
        label: 'Workbook Bundle',
        icon: 'edit_note',
        match: (item) => String(item.catalogKey || '').startsWith(`workbook_g${grade}_`),
      },
    ]
  }

  return [
    {
      key: `academic_textbooks_g${grade}`,
      label: 'Textbook Bundle',
      icon: 'menu_book',
      match: (item) => !String(item.catalogKey || '').startsWith('notebooks_bundle'),
    },
  ]
}

function cleanLabel(label) {
  return String(label || '')
    .replace(/\s+\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitAmount(total, parts) {
  const safeParts = Math.max(1, Number(parts) || 1)
  const safeTotal = Math.max(0, Math.round(Number(total) || 0))
  const base = Math.floor(safeTotal / safeParts)
  const remainder = safeTotal - base * safeParts
  return Array.from({ length: safeParts }, (_, index) => base + (index < remainder ? 1 : 0))
}

function expandSubItem({ label, price, quantity, position }) {
  const cleaned = cleanLabel(label)
  const expansion = COMBINED_SET_EXPANSIONS.find((entry) => entry.match.test(cleaned))
  if (!expansion) {
    return [{ label: cleaned, price: Number(price || 0), quantity: Number(quantity || 0), position }]
  }

  const prices = splitAmount(price, expansion.items.length)
  return expansion.items.map((bookName, index) => ({
    label: bookName,
    price: prices[index],
    quantity: Number(quantity || 0),
    position: position + index,
  }))
}

async function restructureKit(tx, kit) {
  const grade = kit.class.grade
  const groups = bundleGroupsForGrade(grade)
  const sourceItems = kit.items.filter(
    (item) =>
      !item.isArchived &&
      !String(item.catalogKey || '').startsWith('notebooks_bundle') &&
      !String(item.catalogKey || '').startsWith('academic_textbooks_') &&
      !String(item.catalogKey || '').startsWith('academic_workbooks_'),
  )

  if (!sourceItems.length) return { bundles: 0, archived: 0 }

  let createdBundles = 0
  const archivedIds = new Set()

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex]
    const members = sourceItems.filter(group.match)
    if (!members.length) continue

    const subItems = members.flatMap((item, index) => {
      const stock = item.bookStocks?.[0]?.quantity ?? 0
      return expandSubItem({
        label: cleanLabel(item.label),
        price: Number(item.price ?? 0),
        quantity: Number(stock ?? 0),
        position: index,
      }).map((sub, offset) => ({ ...sub, position: index * 100 + offset, isActive: true }))
    })

    const setPrice = group.setPrice ?? subItems.reduce((sum, item) => sum + Number(item.price || 0), 0)
    const bundleStock = subItems.reduce((min, item) => Math.min(min, Number(item.quantity || 0)), Number.POSITIVE_INFINITY)
    const safeBundleStock = Number.isFinite(bundleStock) ? bundleStock : 0
    const firstStock = members.find((item) => item.bookStocks?.[0])?.bookStocks?.[0]
    const branchId = firstStock?.branchId || kit.class.branchId

    const existing = await tx.bookKitItem.findFirst({
      where: { kitId: kit.id, catalogKey: group.key },
      select: { id: true },
    })

    let bundle
    if (existing) {
      await tx.bookKitSubItem.deleteMany({ where: { kitItemId: existing.id } })
      bundle = await tx.bookKitItem.update({
        where: { id: existing.id },
        data: {
          label: group.label,
          icon: group.icon,
          price: 0,
          setPrice,
          productType: 'SET',
          position: groupIndex,
          isArchived: false,
          subItems: { create: subItems },
        },
      })
    } else {
      bundle = await tx.bookKitItem.create({
        data: {
          kitId: kit.id,
          catalogKey: group.key,
          label: group.label,
          icon: group.icon,
          price: 0,
          setPrice,
          productType: 'SET',
          position: groupIndex,
          isArchived: false,
          subItems: { create: subItems },
        },
      })
    }

    await tx.bookStock.upsert({
      where: { itemId_branchId: { itemId: bundle.id, branchId } },
      create: {
        itemId: bundle.id,
        branchId,
        quantity: safeBundleStock,
        tone: safeBundleStock <= 10 ? 'CRITICAL' : safeBundleStock <= 25 ? 'LOW' : 'NORMAL',
      },
      update: {
        quantity: safeBundleStock,
        tone: safeBundleStock <= 10 ? 'CRITICAL' : safeBundleStock <= 25 ? 'LOW' : 'NORMAL',
      },
    })

    for (const item of members) archivedIds.add(item.id)
    createdBundles += 1
  }

  if (archivedIds.size) {
    await tx.bookKitItem.updateMany({
      where: { id: { in: Array.from(archivedIds) } },
      data: { isArchived: true },
    })
  }

  await tx.bookKit.update({
    where: { id: kit.id },
    data: { lastUpdated: new Date() },
  })

  return { bundles: createdBundles, archived: archivedIds.size }
}

async function verify() {
  const branches = await prisma.branch.findMany({
    where: { code: { in: BRANCH_CODES } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  })

  for (const branch of branches) {
    const classes = await prisma.academicClass.findMany({
      where: { branchId: branch.id, grade: { gte: -2, lte: 10 } },
      include: {
        bookKits: {
          where: { kind: 'ACADEMIC' },
          take: 1,
          include: {
            items: {
              where: { isArchived: false },
              include: { subItems: { where: { isActive: true } } },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    })

    let bad = 0
    for (const cls of classes) {
      const items = cls.bookKits[0]?.items || []
      const nonNotebook = items.filter((item) => !String(item.catalogKey || '').startsWith('notebooks_bundle'))
      const expected = cls.grade >= 6 ? (cls.grade === 10 ? 1 : 2) : 1
      if (nonNotebook.length !== expected) bad += 1
    }
    console.log(`${branch.code}: verified ${classes.length} class section(s), mismatched academic bundle count: ${bad}`)
  }
}

async function cloneActiveItemsToEmptyKits() {
  const kits = await prisma.bookKit.findMany({
    where: {
      kind: 'ACADEMIC',
      class: {
        branch: { code: { in: BRANCH_CODES } },
        grade: { gte: -2, lte: 10 },
      },
    },
    include: {
      class: { select: { branchId: true, grade: true, section: true } },
      items: {
        where: { isArchived: false },
        include: {
          subItems: { where: { isActive: true }, orderBy: { position: 'asc' } },
          bookStocks: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  const templateByBranchGrade = new Map()
  for (const kit of kits) {
    if (!kit.items.length) continue
    const key = `${kit.class.branchId}|${kit.class.grade}`
    const existing = templateByBranchGrade.get(key)
    if (!existing || kit.class.section === 'A') templateByBranchGrade.set(key, kit)
  }

  let clonedKits = 0
  let clonedItems = 0
  for (const kit of kits) {
    if (kit.items.length) continue
    const template = templateByBranchGrade.get(`${kit.class.branchId}|${kit.class.grade}`)
    if (!template) continue

    await prisma.$transaction(async (tx) => {
      for (const item of template.items) {
        const created = await tx.bookKitItem.create({
          data: {
            kitId: kit.id,
            catalogKey: item.catalogKey,
            label: item.label,
            icon: item.icon,
            price: item.price,
            setPrice: item.setPrice,
            productType: item.productType,
            position: item.position,
            isArchived: false,
            subItems: item.subItems.length
              ? {
                  create: normalizeSubItems(item.subItems).map((sub, index) => ({
                    label: sub.label,
                    price: sub.price,
                    quantity: sub.quantity,
                    position: index,
                    isActive: true,
                  })),
                }
              : undefined,
          },
        })

        for (const stock of item.bookStocks) {
          await tx.bookStock.create({
            data: {
              itemId: created.id,
              branchId: stock.branchId,
              quantity: stock.quantity,
              reserved: stock.reserved,
              tone: stock.tone,
            },
          })
        }
        clonedItems += 1
      }
      await tx.bookKit.update({ where: { id: kit.id }, data: { lastUpdated: new Date() } })
    }, { timeout: 30000 })
    clonedKits += 1
  }

  console.log(`Cloned category bundles into ${clonedKits} empty section kit(s), creating ${clonedItems} product row(s)`)
}

function normalizeSubItems(subItems = []) {
  return subItems
    .flatMap((sub, index) =>
      expandSubItem({
        label: sub.label,
        price: Number(sub.price || 0),
        quantity: Number(sub.quantity || 0),
        position: index * 100,
      }),
    )
    .map((sub, index) => ({ ...sub, position: index, isActive: true }))
}

async function normalizeActiveBundleSubItems() {
  const bundles = await prisma.bookKitItem.findMany({
    where: {
      isArchived: false,
      catalogKey: {
        in: [
          ...Array.from({ length: 13 }, (_, index) => `academic_textbooks_g${index - 2}`),
          ...Array.from({ length: 5 }, (_, index) => `academic_workbooks_g${index + 6}`),
        ],
      },
      kit: { class: { branch: { code: { in: BRANCH_CODES } } } },
    },
    include: {
      subItems: { where: { isActive: true }, orderBy: { position: 'asc' } },
    },
  })

  let normalized = 0
  for (const bundle of bundles) {
    const nextSubItems = normalizeSubItems(bundle.subItems)
    const before = JSON.stringify(bundle.subItems.map((sub) => ({
      label: sub.label,
      price: Number(sub.price),
      quantity: sub.quantity,
    })))
    const after = JSON.stringify(nextSubItems.map((sub) => ({
      label: sub.label,
      price: Number(sub.price),
      quantity: sub.quantity,
    })))
    if (before === after) continue

    await prisma.$transaction(async (tx) => {
      await tx.bookKitSubItem.deleteMany({ where: { kitItemId: bundle.id } })
      await tx.bookKitSubItem.createMany({
        data: nextSubItems.map((sub) => ({
          kitItemId: bundle.id,
          label: sub.label,
          price: sub.price,
          quantity: sub.quantity,
          position: sub.position,
          isActive: true,
        })),
      })
    })
    normalized += 1
  }
  console.log(`Normalized sub-item labels/combined sets in ${normalized} active academic bundle(s)`)
}

async function ensureRequiredZeroPriceSubItems() {
  const classes = await prisma.academicClass.findMany({
    where: {
      branch: { code: { in: BRANCH_CODES } },
      grade: { in: [4, 5, 9, 10] },
    },
    include: {
      branch: { select: { code: true } },
      bookKits: {
        where: { kind: 'ACADEMIC' },
        take: 1,
        include: {
          items: {
            where: {
              isArchived: false,
              catalogKey: { in: ['academic_textbooks_g4', 'academic_textbooks_g5', 'academic_workbooks_g9', 'academic_workbooks_g10'] },
            },
            include: { subItems: { where: { isActive: true }, orderBy: { position: 'asc' } } },
          },
        },
      },
    },
  })

  let created = 0
  for (const cls of classes) {
    const isPrimary = cls.grade === 4 || cls.grade === 5
    const bundleKey = isPrimary ? `academic_textbooks_g${cls.grade}` : `academic_workbooks_g${cls.grade}`
    const bundle = cls.bookKits[0]?.items?.find((item) => item.catalogKey === bundleKey)
    if (!bundle) continue

    const requiredRows = isPrimary ? PRIMARY_ZERO_SUBITEMS[cls.grade] : WORKBOOK_ZERO_SUBITEMS[cls.grade]
    const stock = isPrimary
      ? PRIMARY_ZERO_STOCK[cls.branch.code]?.[cls.grade] ?? 0
      : HIGH_SCHOOL_ZERO_STOCK[cls.branch.code]?.[cls.grade] ?? 0

    const existingLabels = new Set(bundle.subItems.map((item) => cleanLabel(item.label)))
    for (const row of requiredRows) {
      if (existingLabels.has(row.label)) continue
      await prisma.bookKitSubItem.create({
        data: {
          kitItemId: bundle.id,
          label: row.label,
          price: 0,
          quantity: stock,
          position: row.position,
          isActive: true,
        },
      })
      existingLabels.add(row.label)
      created += 1
    }
  }

  const touchedBundles = await prisma.bookKitItem.findMany({
    where: {
      isArchived: false,
      catalogKey: { in: ['academic_textbooks_g4', 'academic_textbooks_g5', 'academic_workbooks_g9', 'academic_workbooks_g10'] },
      kit: { class: { branch: { code: { in: BRANCH_CODES } } } },
    },
    include: { subItems: { where: { isActive: true }, orderBy: [{ position: 'asc' }, { label: 'asc' }] } },
  })

  const primaryOrder = [
    'Telugu - Text book',
    'Telugu - Work Book',
    'Telugu - Copy Writing',
    'Hindi - Text book',
    'Hindi - Copy Writing',
    'English - Text book',
    'English - Grammar',
    'English - Copy Writing',
    'Mathematics - Text book Opas',
    'EVS - Opas',
    'Science - Blue Duck / Navneeth',
    'Social - Blue Duck / Navneeth',
    'Computer - Login',
    'General Knowledge - Pranavi',
    'Abacus - Abacus',
    'Drawing - Art & Craft',
    'Diary - Diary',
    'Exam Booklet - Exam Booklet',
  ]
  const workbookOrder = [
    'Telugu W.B - Telangana CCE revised Edition',
    'Hindi W.B - VSR',
    'English W.B - Telangana CCE revised Edition',
    'Eng. Grammar - Glorious English Grammar',
    'Mathematics W.B - Objective Manual',
    'Physical Science W.B - Telangana CCE revised Edition',
    'Physics Drawing - Step-by-step way of learning',
    'Biology W.B - Biology W.B',
    'Biology Drawing - Step-by-step way of learning',
    'Social Studies W.B - As per TG Govt. Text book',
    'Map Pointing - Analytical Map pointing & Map reading',
    'Vedic Math - Vedic Math',
    'General Knowledge - Pranavi',
    'Computer - Login 3.0',
    'Exam Booklet - Exam Booklet',
    'Diary - Diary',
  ]

  for (const bundle of touchedBundles) {
    const order = bundle.catalogKey?.startsWith('academic_textbooks') ? primaryOrder : workbookOrder
    for (const sub of bundle.subItems) {
      const nextPosition = order.indexOf(cleanLabel(sub.label))
      if (nextPosition >= 0 && sub.position !== nextPosition) {
        await prisma.bookKitSubItem.update({ where: { id: sub.id }, data: { position: nextPosition } })
      }
    }
  }

  console.log(`Ensured ${created} missing zero-price/NV sub-item row(s)`)
}

async function deleteArchivedProducts() {
  const archived = await prisma.bookKitItem.findMany({
    where: {
      isArchived: true,
      kit: { class: { branch: { code: { in: BRANCH_CODES } } } },
    },
    select: { id: true },
  })
  const ids = archived.map((item) => item.id)
  if (!ids.length) {
    console.log('Deleted 0 archived product row(s)')
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryLog.deleteMany({ where: { bookItemId: { in: ids } } })
    await tx.stockTransferItem.deleteMany({ where: { bookItemId: { in: ids } } })
    await tx.orderItem.deleteMany({ where: { bookItemId: { in: ids } } })
    await tx.procurementEntry.deleteMany({ where: { bookItemId: { in: ids } } })
    await tx.bookStock.deleteMany({ where: { itemId: { in: ids } } })
    await tx.bookKitSubItem.deleteMany({ where: { kitItemId: { in: ids } } })
    await tx.bookKitItem.deleteMany({ where: { id: { in: ids } } })
  }, { timeout: 30000 })

  console.log(`Deleted ${ids.length} archived product row(s)`)
}

async function normalizeOfficialBundlePrices() {
  const rows = await prisma.bookKitItem.findMany({
    where: {
      catalogKey: { in: Object.keys(GOV_TEXTBOOK_TOTALS).map((grade) => `academic_textbooks_g${grade}`) },
      kit: {
        class: {
          branch: { code: { in: BRANCH_CODES } },
        },
      },
    },
    include: { kit: { include: { class: { select: { grade: true } } } } },
  })

  let updated = 0
  for (const row of rows) {
    const official = GOV_TEXTBOOK_TOTALS[row.kit.class.grade]
    if (!official || Number(row.setPrice) === official) continue
    await prisma.bookKitItem.update({ where: { id: row.id }, data: { setPrice: official } })
    updated += 1
  }
  console.log(`Normalized ${updated} government textbook bundle price(s) to official totals`)
}

async function main() {
  const kits = await prisma.bookKit.findMany({
    where: {
      kind: 'ACADEMIC',
      class: {
        branch: { code: { in: BRANCH_CODES } },
        grade: { gte: -2, lte: 10 },
      },
    },
    include: {
      class: { select: { branchId: true, grade: true, section: true } },
      items: {
        include: {
          bookStocks: true,
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [{ class: { grade: 'asc' } }, { class: { section: 'asc' } }],
  })

  let totalBundles = 0
  let totalArchived = 0
  for (const kit of kits) {
    const result = await prisma.$transaction((tx) => restructureKit(tx, kit), { timeout: 30000 })
    totalBundles += result.bundles
    totalArchived += result.archived
  }

  console.log(`Created/updated ${totalBundles} academic bundle row(s)`)
  console.log(`Archived ${totalArchived} individual academic product row(s)`)
  console.log(`Bundle rounding helper check: 3998 -> ${roundUpToFive(3998)}`)
  await cloneActiveItemsToEmptyKits()
  await normalizeOfficialBundlePrices()
  await normalizeActiveBundleSubItems()
  await ensureRequiredZeroPriceSubItems()
  await deleteArchivedProducts()
  await verify()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
