const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ACADEMIC_YEAR = '2024-25'
const SECTIONS = ['A', 'B', 'C', 'D']

const BRANCHES = [
  {
    legacyCodes: ['CAMP-A', 'NHS_DARGA'],
    code: 'NHS_DARGA',
    name: 'Darga',
    shortName: 'Darga',
    address: 'Darga, Hyderabad',
  },
  {
    legacyCodes: ['CAMP-C', 'NS_SHAIKPET'],
    code: 'NS_SHAIKPET',
    name: 'Shaikpet',
    shortName: 'Shaikpet',
    address: 'Shaikpet, Hyderabad',
  },
  {
    legacyCodes: ['CAMP-B', 'SVN_NARSINGI'],
    code: 'SVN_NARSINGI',
    name: 'Narsingi',
    shortName: 'Narsingi',
    address: 'Narsingi, Hyderabad',
  },
]

const CLASSES = [
  { grade: -2, label: 'Nursery' },
  { grade: -1, label: 'LKG' },
  { grade: 0, label: 'UKG' },
  ...Array.from({ length: 10 }, (_, index) => ({ grade: index + 1, label: `Class ${index + 1}` })),
]

const NOTEBOOK_BUNDLES = {
  [-2]: { total: 132, items: [['Four Rule', 2], ['Big Check Rule', 2]] },
  [-1]: { total: 165, items: [['Four Rule', 3], ['Small Check Rule', 2]] },
  [0]: { total: 264, items: [['Four Rule', 4], ['Small Check Rule', 2], ['Double Rule', 2]] },
  [1]: { total: 462, items: [['Four Rule', 8], ['Double Rule', 4], ['Maths Ruled Book', 2]] },
  [2]: { total: 462, items: [['Four Rule', 8], ['Double Rule', 4], ['Maths Ruled Book', 2]] },
  [3]: { total: 462, items: [['Double Rule', 4], ['Four Rule', 6], ['Maths Ruled Book', 2], ['One Side Rule', 2]] },
  [4]: { total: 495, items: [['Double Rule', 4], ['Four Rule', 2], ['Maths Ruled Book', 3], ['One Side Rule', 2], ['Single Ruled', 4]] },
  [5]: { total: 495, items: [['Double Rule', 4], ['Four Rule', 2], ['Maths Ruled Book', 3], ['One Side Rule', 2], ['Single Ruled', 4]] },
  [6]: { total: 528, items: [['Single Ruled', 10], ['Plain', 3], ['One Side', 2], ['Four Rule', 1]] },
  [7]: { total: 528, items: [['Single Ruled', 10], ['Plain', 3], ['One Side', 2], ['Four Rule', 1]] },
  [8]: { total: 627, items: [['Long Books Plain', 18], ['Four Rule', 1]] },
  [9]: { total: 627, items: [['Long Books Plain', 18], ['Four Rule', 1]] },
  [10]: { total: 594, items: [['300 Pages Plain', 18]] },
}

const PRE_PRIMARY = {
  [-2]: {
    label: 'Nursery',
    products: [
      ['Play with dots', 'Simply', 150],
      ['Picture Gallery', 'Simply', 135],
      ['Alphabet Book', 'Simply', 185],
      ['Number Writing 1 to 50', 'Simply', 165],
      ['Capital Alphabet', 'Simply', 185],
      ['Small Alphabet', 'Simply', 185],
      ['Rhymes', 'Simply', 135],
      ['Art & Craft', 'Simply', 190],
      ['Activity Worksheets', 'Simply', 279],
      ['Alphabet Capital Practice', 'Techno', 150],
      ['Alphabet Small Practice', 'Techno', 150],
      ['Numbers Practice', 'Techno', 150],
    ],
    stock: { NHS_DARGA: 80, NS_SHAIKPET: 80, SVN_NARSINGI: 70 },
    stockOverrides: {
      SVN_NARSINGI: {
        'Alphabet Capital Practice': 0,
        'Alphabet Small Practice': 0,
        'Numbers Practice': 0,
      },
    },
  },
  [-1]: {
    label: 'LKG',
    products: [
      ['Navneeth LKG Combined Set', 'Navneeth', 2020, [
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
      ]],
      ['Cursive Capital Letters', 'Pranavi', 140],
      ['Small Practice', 'Deccan', 180],
      ['Small and Capital Practice', 'Deccan', 180],
      ['Numbers Practice', 'Deccan', 180],
    ],
    stock: { NHS_DARGA: 80, NS_SHAIKPET: 80, SVN_NARSINGI: 65 },
  },
  [0]: {
    label: 'UKG',
    products: [
      ['Rockland UKG Combined Set', 'Rockland', 2399, [
        'Course Book 1 & 2',
        'Activity 1 & 2',
        'Rhymes & Stories',
        'Art & Colour',
      ]],
      ['Small Cursive Letters', 'Pranavi', 140],
      ['Telugu Textbook', '', 180],
      ['Telugu Copy Writing', '', 162],
    ],
    stock: { NHS_DARGA: 80, NS_SHAIKPET: 80, SVN_NARSINGI: 70 },
  },
}

const PRIMARY_ROWS = [
  ['Telugu', 'Text book', 'Techno', [80, 130], [90, 110], [75, 130], [70, 140], [70, 100], { NS_SHAIKPET: [80, 80, 80, 75, 50], SVN_NARSINGI: [70, 65, 75, 65, 40] }],
  ['Telugu', 'Work Book', 'Techno', [80, 60], [90, 60], [75, 60], [70, 70], [70, 175], { NS_SHAIKPET: [80, 80, 80, 75, 50], SVN_NARSINGI: [70, 65, 75, 65, 40] }],
  ['Telugu', 'Copy Writing', 'Techno', [80, 100], [90, 100], [75, 100], [70, 100], [80, 100], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Hindi', 'Text book', 'Pranavi', [80, 250], [90, 260], [75, 270], [70, 300], [80, 310], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Hindi', 'Copy Writing', 'Magnus', [80, 84], [90, 84], [75, 84], [70, 84], [80, 84], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['English', 'Text book', 'Srijan', [80, 519], [90, 519], [75, 579], [70, 4250], [80, 4250], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['English', 'Grammar', 'Amanda/Navneeth', [80, 140], [90, 140], [75, 160], [70, 0], [80, 0], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['English', 'Copy Writing', 'Magnus', [80, 149], [90, 149], [75, 149], [70, 149], [80, 149], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Mathematics', 'Text book Opas', 'Hari Om', [80, 295], [90, 335], [75, 365], [70, 0], [80, 0], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['EVS', 'Opas', 'Hari Om', [80, 250], [90, 275], [75, 0], [70, 0], [80, 0], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Science', 'Blue Duck / Navneeth', 'Techno', [80, 0], [90, 0], [75, 420], [70, 0], [80, 0], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Social', 'Blue Duck / Navneeth', 'Techno', [80, 0], [90, 0], [75, 420], [70, 0], [80, 0], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Computer', 'Login', 'Simply', [80, 280], [90, 300], [75, 330], [70, 370], [80, 395], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['General Knowledge', 'Pranavi', 'Pranavi', [80, 210], [90, 220], [75, 230], [70, 240], [80, 250], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Abacus', 'Abacus', 'Vishwam', [80, 450], [90, 450], [75, 450], [70, 450], [80, 450], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Drawing', 'Art & Craft', 'Pranavi', [80, 399], [90, 399], [75, 350], [70, 399], [80, 399], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Diary', 'Diary', '', [80, 110], [90, 110], [75, 110], [70, 110], [80, 110], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
  ['Exam Booklet', 'Exam Booklet', '', [80, 110], [90, 110], [75, 110], [70, 110], [80, 110], { NS_SHAIKPET: [80, 80, 80, 75, 70], SVN_NARSINGI: [70, 65, 75, 65, 65] }],
]

const WORKBOOK_ROWS = [
  ['Telugu W.B', 'Telangana CCE revised Edition', 'Glorious', [80, 297], [90, 279], [90, 351], [90, 540], [60, 666]],
  ['Hindi W.B', 'VSR', 'VSR', [80, 279], [90, 369], [90, 378], [90, 405], [60, 666]],
  ['English W.B', 'Telangana CCE revised Edition', 'Techno', [80, 387], [90, 423], [90, 495], [90, 612], [60, 819]],
  ['Eng. Grammar', 'Glorious English Grammar', 'Techno', [80, 140], [90, 160], [90, 160], [90, 180], [60, 0]],
  ['Mathematics W.B', 'Objective Manual', 'Shiridi', [80, 200], [90, 200], [90, 240], [90, 250], [60, 320]],
  ['Physical Science W.B', 'Telangana CCE revised Edition', 'Glorious', [80, 279], [90, 333], [90, 414], [90, 522], [60, 774]],
  ['Physics Drawing', 'Step-by-step way of learning', 'Vikrant', [80, 98], [90, 98], [90, 98], [90, 98], [60, 81]],
  ['Biology W.B', 'Biology W.B', '', [80, 0], [90, 0], [90, 549], [90, 594], [60, 774]],
  ['Biology Drawing', 'Step-by-step way of learning', 'Rock land', [80, 0], [90, 0], [90, 98], [90, 98], [60, 81]],
  ['Social Studies W.B', 'As per TG Govt. Text book', 'Rock land', [80, 412], [90, 539], [90, 588], [90, 599], [60, 952]],
  ['Map Pointing', 'Analytical Map pointing & Map reading', 'Rock land', [80, 129], [90, 129], [90, 129], [90, 129], [60, 129]],
  ['Vedic Math', 'Vedic Math', 'Vishwam', [80, 450], [90, 450], [90, 450], [90, 450], [60, 0]],
  ['General Knowledge', 'Pranavi', 'Pranavi', [80, 260], [90, 270], [90, 280], [90, 0], [60, 0]],
  ['Computer', 'Login 3.0', 'Simply Books', [80, 445], [90, 470], [90, 475], [90, 475], [60, 0]],
  ['Exam Booklet', 'Exam Booklet', '', [80, 130], [90, 130], [90, 130], [90, 130], [60, 130]],
  ['Diary', 'Diary', '', [80, 110], [90, 110], [90, 110], [90, 110], [60, 110]],
]

const HIGH_SCHOOL_STOCK = {
  NHS_DARGA: [80, 90, 90, 90, 60],
  NS_SHAIKPET: [55, 55, 50, 40, 40],
  SVN_NARSINGI: [50, 50, 40, 40, 30],
}

const HIGH_SCHOOL_WORKBOOK_STOCK = {
  NHS_DARGA: {
    'Telugu W.B': [80, 90, 90, 90, 60],
    'Hindi W.B': [80, 90, 90, 90, 60],
    'English W.B': [80, 90, 90, 90, 60],
    'Eng. Grammar': [80, 90, 90, 90, 0],
    'Mathematics W.B': [80, 90, 90, 90, 60],
    'Physical Science W.B': [80, 90, 90, 90, 60],
    'Physics Drawing': [80, 90, 90, 90, 60],
    'Biology W.B': [80, 90, 90, 90, 60],
    'Biology Drawing': [80, 90, 90, 90, 60],
    'Social Studies W.B': [80, 90, 90, 90, 60],
    'Map Pointing': [80, 90, 90, 90, 60],
    'Vedic Math': [80, 90, 90, 90, 0],
    'General Knowledge': [80, 90, 90, 0, 0],
    'Computer': [80, 90, 90, 90, 0],
    'Exam Booklet': [80, 90, 90, 90, 60],
    'Diary': [80, 90, 90, 90, 60],
  },
  SVN_NARSINGI: {
    'Telugu W.B': [50, 50, 40, 40, 30],
    'Hindi W.B': [50, 50, 40, 40, 30],
    'English W.B': [50, 50, 40, 40, 30],
    'Eng. Grammar': [50, 50, 40, 40, 30],
    'Mathematics W.B': [50, 50, 40, 40, 30],
    'Physical Science W.B': [50, 50, 40, 40, 30],
    'Physics Drawing': [50, 50, 40, 40, 30],
    'Biology W.B': [50, 50, 40, 40, 30],
    'Biology Drawing': [50, 50, 40, 40, 30],
    'Social Studies W.B': [50, 50, 40, 40, 30],
    'Map Pointing': [50, 50, 40, 40, 30],
    'Vedic Math': [50, 50, 40, 40, 30],
    'General Knowledge': [50, 50, 40, 0, 30],
    'Computer': [50, 50, 40, 40, 30],
    'Exam Booklet': [50, 50, 40, 40, 30],
    'Diary': [50, 50, 40, 40, 30],
  },
  NS_SHAIKPET: {
    'Telugu W.B': [55, 55, 50, 40, 40],
    'Hindi W.B': [55, 55, 50, 40, 40],
    'English W.B': [55, 55, 50, 40, 40],
    'Eng. Grammar': [55, 55, 50, 40, 40],
    'Mathematics W.B': [55, 55, 50, 40, 40],
    'Physical Science W.B': [55, 55, 50, 40, 40],
    'Physics Drawing': [55, 55, 50, 40, 40],
    'Biology W.B': [55, 55, 50, 40, 40],
    'Biology Drawing': [55, 55, 50, 40, 40],
    'Social Studies W.B': [55, 55, 50, 40, 40],
    'Map Pointing': [55, 55, 50, 40, 40],
    'Vedic Math': [55, 55, 50, 40, 40],
    'General Knowledge': [55, 55, 50, 40, 40],
    'Computer': [55, 55, 50, 40, 40],
    'Exam Booklet': [55, 55, 50, 40, 40],
    'Diary': [55, 55, 50, 40, 40],
  },
}

const GOV_TEXTBOOK_ROWS = [
  ['Telugu T.B', [160, 160, 160, 160]],
  ['Hindi T.B', [90, 90, 90, 90]],
  ['English T.B', [130, 130, 130, 130]],
  ['Mathematics T.B', [123, 179, 205, 201]],
  ['Physical Science T.B', [102, 110, 112, 132]],
  ['Biology T.B', [0, 0, 112, 112]],
  ['Social Studies T.B', [114, 127, 158, 168]],
]

const GOV_STOCK = {
  NHS_DARGA: [[40, 50, 30, 10]],
  NS_SHAIKPET: [[30, 30, 20, 10]],
  SVN_NARSINGI: [[30, 20, 20, 10]],
}

const ICON_BY_LABEL = [
  [/notebook/i, 'auto_stories'],
  [/work|w\.b|copy|practice|grammar|booklet|diary/i, 'edit_note'],
  [/math|abacus|vedic/i, 'calculate'],
  [/science|physics|biology/i, 'science'],
  [/telugu|hindi|english|rhymes|literacy|alphabet/i, 'language'],
  [/drawing|art|craft|colour/i, 'palette'],
]

function gradeLabel(grade) {
  return CLASSES.find((item) => item.grade === Number(grade))?.label ?? `Class ${grade}`
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function iconFor(label) {
  return ICON_BY_LABEL.find(([regex]) => regex.test(label))?.[1] ?? 'menu_book'
}

function stockTone(quantity) {
  if (quantity <= 10) return 'CRITICAL'
  if (quantity <= 25) return 'LOW'
  return 'NORMAL'
}

async function ensureBranches() {
  const resolved = {}
  for (const def of BRANCHES) {
    let branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: { in: def.legacyCodes } },
          { name: def.name },
          { name: def.shortName },
        ],
      },
    })

    if (branch) {
      branch = await prisma.branch.update({
        where: { id: branch.id },
        data: {
          code: def.code,
          name: def.name,
          type: 'BRANCH',
          address: def.address,
          isActive: true,
          deletedAt: null,
        },
      })
    } else {
      branch = await prisma.branch.create({
        data: {
          code: def.code,
          name: def.name,
          type: 'BRANCH',
          address: def.address,
          isActive: true,
        },
      })
    }
    resolved[def.code] = branch
  }
  return resolved
}

async function ensureClasses(branchesByCode) {
  for (const branch of Object.values(branchesByCode)) {
    for (const cls of CLASSES) {
      for (const section of SECTIONS) {
        const academicClass = await prisma.academicClass.upsert({
          where: {
            grade_section_branchId_academicYear: {
              grade: cls.grade,
              section,
              branchId: branch.id,
              academicYear: ACADEMIC_YEAR,
            },
          },
          update: { label: `${cls.label}-${section}` },
          create: {
            grade: cls.grade,
            section,
            branchId: branch.id,
            academicYear: ACADEMIC_YEAR,
            label: `${cls.label}-${section}`,
            studentCount: 0,
          },
        })

        await prisma.bookKit.upsert({
          where: { classId_kind: { classId: academicClass.id, kind: 'ACADEMIC' } },
          update: {
            label: `${cls.label} Kit Details`,
            badge: 'Academic Kit',
            lastUpdated: new Date(),
          },
          create: {
            classId: academicClass.id,
            kind: 'ACADEMIC',
            label: `${cls.label} Kit Details`,
            badge: 'Academic Kit',
            lastUpdated: new Date(),
          },
        })

        await prisma.bookKit.upsert({
          where: { classId_kind: { classId: academicClass.id, kind: 'NOTEBOOKS' } },
          update: {
            label: `${cls.label} — Notebooks`,
            badge: 'Notebooks',
            lastUpdated: new Date(),
          },
          create: {
            classId: academicClass.id,
            kind: 'NOTEBOOKS',
            label: `${cls.label} — Notebooks`,
            badge: 'Notebooks',
            lastUpdated: new Date(),
          },
        })
      }
    }
  }
}

async function wipeSeededData() {
  await prisma.$transaction([
    prisma.inventoryLog.deleteMany({}),
    prisma.stockTransferItem.deleteMany({}),
    prisma.stockTransfer.deleteMany({}),
    prisma.transaction.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.procurementEntry.deleteMany({}),
    prisma.publisherPayment.deleteMany({}),
    prisma.publisher.deleteMany({}),
    prisma.bookStock.deleteMany({}),
    prisma.bookKitSubItem.deleteMany({}),
    prisma.bookKitItem.deleteMany({}),
  ])
}

async function seedItem(tx, { kitId, branchId, catalogKey, label, publisher, price, stock, position, productType = 'INDIVIDUAL', subItems = [] }) {
  const item = await tx.bookKitItem.create({
    data: {
      kitId,
      catalogKey,
      label,
      icon: iconFor(label),
      price,
      setPrice: null,
      productType,
      position,
      isArchived: false,
      subItems: subItems.length
        ? {
            create: subItems.map((subLabel, index) => ({
              label: subLabel,
              price: 0,
              quantity: 1,
              position: index,
              isActive: true,
            })),
          }
        : undefined,
    },
  })

  await tx.bookStock.create({
    data: {
      itemId: item.id,
      branchId,
      quantity: stock,
      tone: stockTone(stock),
    },
  })

  return item
}

async function seedNotebook(tx, kitId, branchId, grade, position) {
  const bundle = NOTEBOOK_BUNDLES[grade]
  if (!bundle) return

  const item = await tx.bookKitItem.create({
    data: {
      kitId,
      catalogKey: 'notebooks_bundle',
      label: 'Notebook Bundle',
      icon: 'auto_stories',
      price: 33,
      setPrice: bundle.total,
      productType: 'SET',
      position,
      isArchived: false,
      subItems: {
        create: bundle.items.map(([label, quantity], index) => ({
          label,
          price: 33,
          quantity,
          position: index,
          isActive: true,
        })),
      },
    },
  })

  await tx.bookStock.create({
    data: {
      itemId: item.id,
      branchId,
      quantity: 500,
      tone: 'NORMAL',
    },
  })
}

async function seedPrePrimary(tx, kitId, notebookKitId, branchCode, branchId, grade) {
  const config = PRE_PRIMARY[grade]
  let position = 0
  for (const [name, publisher, price, subItems] of config.products) {
    const overrides = config.stockOverrides?.[branchCode] ?? {}
    const stock = overrides[name] ?? config.stock[branchCode]
    await seedItem(tx, {
      kitId,
      branchId,
      catalogKey: `pre_${grade}_${slug(name)}`,
      label: name,
      publisher,
      price,
      stock,
      position,
      productType: subItems?.length ? 'SET' : 'INDIVIDUAL',
      subItems: subItems ?? [],
    })
    position += 1
  }
  await seedNotebook(tx, notebookKitId, branchId, grade, 90)
}

async function seedPrimary(tx, kitId, notebookKitId, branchCode, branchId, grade) {
  let position = 0
  const gradeIndex = grade - 1
  for (const row of PRIMARY_ROWS) {
    const [subject, book, publisher, ...rest] = row
    const cells = rest.slice(0, 5)
    const meta = rest[5] ?? {}
    const cell = cells[gradeIndex]
    if (!cell) continue
    const branchQty = meta[branchCode]?.[gradeIndex]
    const stock = branchQty ?? cell[0]
    if (stock == null) continue
    await seedItem(tx, {
      kitId,
      branchId,
      catalogKey: `primary_g${grade}_${slug(subject)}_${slug(book)}`,
      label: `${subject} - ${book}`,
      publisher,
      price: cell[1],
      stock,
      position,
    })
    position += 1
  }
  await seedNotebook(tx, notebookKitId, branchId, grade, 90)
}

async function seedWorkbooks(tx, kitId, notebookKitId, branchCode, branchId, grade) {
  let position = 0
  const gradeIndex = grade - 6
  for (const [subject, book, publisher, ...cells] of WORKBOOK_ROWS) {
    const cell = cells[gradeIndex]
    if (!cell) continue
    await seedItem(tx, {
      kitId,
      branchId,
      catalogKey: `workbook_g${grade}_${slug(subject)}_${slug(book)}`,
      label: `${subject} - ${book}`,
      publisher,
      price: cell[1],
      stock: HIGH_SCHOOL_WORKBOOK_STOCK[branchCode]?.[subject]?.[gradeIndex] ?? HIGH_SCHOOL_STOCK[branchCode][gradeIndex],
      position,
    })
    position += 1
  }

  if (grade <= 9) {
    const govIndex = grade - 6
    const stockByGrade = GOV_STOCK[branchCode][0]
    for (const [subject, prices] of GOV_TEXTBOOK_ROWS) {
      await seedItem(tx, {
        kitId,
        branchId,
        catalogKey: `gov_textbook_g${grade}_${slug(subject)}`,
        label: `Government Textbook - ${subject}`,
        publisher: 'TG Govt.',
        price: prices[govIndex],
        stock: stockByGrade[govIndex],
        position,
      })
      position += 1
    }
  }

  await seedNotebook(tx, notebookKitId, branchId, grade, 90)
}

async function seedStock(branchesByCode) {
  for (const [branchCode, branch] of Object.entries(branchesByCode)) {
    const classes = await prisma.academicClass.findMany({
      where: {
        branchId: branch.id,
        section: 'A',
        grade: { gte: -2, lte: 10 },
      },
      orderBy: [{ grade: 'asc' }, { academicYear: 'asc' }],
    })

    for (const cls of classes) {
      const academicKit = await prisma.bookKit.upsert({
        where: { classId_kind: { classId: cls.id, kind: 'ACADEMIC' } },
        update: { lastUpdated: new Date() },
        create: {
          classId: cls.id,
          kind: 'ACADEMIC',
          label: `${gradeLabel(cls.grade)} Kit Details`,
          badge: 'Academic Kit',
          lastUpdated: new Date(),
        },
      })
      const notebookKit = await prisma.bookKit.upsert({
        where: { classId_kind: { classId: cls.id, kind: 'NOTEBOOKS' } },
        update: { lastUpdated: new Date() },
        create: {
          classId: cls.id,
          kind: 'NOTEBOOKS',
          label: `${gradeLabel(cls.grade)} — Notebooks`,
          badge: 'Notebooks',
          lastUpdated: new Date(),
        },
      })

      await prisma.$transaction(async (tx) => {
        if (cls.grade <= 0) await seedPrePrimary(tx, academicKit.id, notebookKit.id, branchCode, branch.id, cls.grade)
        else if (cls.grade <= 5) await seedPrimary(tx, academicKit.id, notebookKit.id, branchCode, branch.id, cls.grade)
        else await seedWorkbooks(tx, academicKit.id, notebookKit.id, branchCode, branch.id, cls.grade)
      }, { timeout: 30000 })
    }
  }
}

async function verify() {
  const counts = await Promise.all([
    prisma.students.count(),
    prisma.user.count(),
    prisma.bookKitItem.count(),
    prisma.bookStock.count(),
    prisma.bookKitSubItem.count(),
    prisma.order.count(),
    prisma.transaction.count(),
    prisma.publisher.count(),
  ])

  const [students, users, items, stocks, subItems, orders, transactions, publishers] = counts
  console.log('Verification:')
  console.log(`  Students preserved: ${students}`)
  console.log(`  Admin/users preserved: ${users}`)
  console.log(`  Book products seeded: ${items}`)
  console.log(`  Book stock rows seeded: ${stocks}`)
  console.log(`  Notebook/set sub-items seeded: ${subItems}`)
  console.log(`  Orders after wipe: ${orders}`)
  console.log(`  Transactions after wipe: ${transactions}`)
  console.log(`  Publishers/accounts after wipe: ${publishers}`)
}

async function main() {
  console.log('Starting complete 2026 stock seed...')
  const branchesByCode = await ensureBranches()
  await ensureClasses(branchesByCode)
  await wipeSeededData()
  await seedStock(branchesByCode)
  await verify()
  console.log('Complete stock seed finished.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
