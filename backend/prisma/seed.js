const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Branches ────────────────────────────────────────────────────────────────
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: { name: 'Main Warehouse', code: 'MAIN', type: 'MAIN', address: '123 Central Ave', phone: '+1-555-0100' },
  })

  const branchA = await prisma.branch.upsert({
    where: { code: 'CAMP-A' },
    update: { name: 'Darga' },
    create: { name: 'Darga', code: 'CAMP-A', type: 'BRANCH', address: 'Darga, Hyderabad', phone: '+91-000-000-0001' },
  })

  const branchB = await prisma.branch.upsert({
    where: { code: 'CAMP-B' },
    update: { name: 'Narsingi' },
    create: { name: 'Narsingi', code: 'CAMP-B', type: 'BRANCH', address: 'Narsingi, Hyderabad', phone: '+91-000-000-0002' },
  })

  const branchC = await prisma.branch.upsert({
    where: { code: 'CAMP-C' },
    update: { name: 'Shaikpet' },
    create: { name: 'Shaikpet', code: 'CAMP-C', type: 'BRANCH', address: 'Shaikpet, Hyderabad', phone: '+91-000-000-0003' },
  })

  // ── Users ────────────────────────────────────────────────────────────────────
  const superHash = await bcrypt.hash('super123', 12)
  const adminHash = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { username: 'super_admin' },
    update: {},
    create: {
      username: 'super_admin',
      email: 'super@campus360.edu',
      passwordHash: superHash,
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { username: 'school_admin' },
    update: {},
    create: {
      username: 'school_admin',
      email: 'admin@campus360.edu',
      passwordHash: adminHash,
      displayName: 'School Admin',
      role: 'ADMIN',
      branchId: branchA.id,
    },
  })

  // ── Academic Classes ──────────────────────────────────────────────────────────
  const classCatalog = [
    { grade: -2, label: 'Nursery', kitSetSize: 3 },
    { grade: -1, label: 'LKG', kitSetSize: 4 },
    { grade: 0, label: 'UKG', kitSetSize: 5 },
    ...Array.from({ length: 10 }, (_, idx) => {
      const grade = idx + 1
      return { grade, label: `Class ${grade}`, kitSetSize: Math.min(8, grade + 3) }
    }),
  ]
  const sections = ['A', 'B', 'C', 'D']

  for (const branch of [branchA, branchB, branchC]) {
    for (const cls of classCatalog) {
      for (const section of sections) {
        await prisma.academicClass.upsert({
          where: { grade_section_branchId_academicYear: { grade: cls.grade, section, branchId: branch.id, academicYear: '2024-25' } },
          update: { label: `${cls.label}-${section}` },
          create: { grade: cls.grade, section, label: `${cls.label}-${section}`, branchId: branch.id, studentCount: 30, academicYear: '2024-25' },
        })
      }
    }
  }

  // ── Book Kits ─────────────────────────────────────────────────────────────────
  for (const branch of [branchA, branchB, branchC]) {
    for (const clsMeta of classCatalog) {
      const cls = await prisma.academicClass.findFirst({
        where: { grade: clsMeta.grade, section: 'A', branchId: branch.id, academicYear: '2024-25' },
      })
      if (!cls) continue

      const existing = await prisma.bookKit.findUnique({ where: { classId: cls.id } })
      if (existing) {
        await prisma.bookKit.update({
          where: { id: existing.id },
          data: { label: `${clsMeta.label} Kit Details`, badge: 'Academic Kit' },
        })
        continue
      }

      await prisma.bookKit.create({
        data: {
          classId: cls.id,
          label: `${clsMeta.label} Kit Details`,
          badge: 'Academic Kit',
          items: {
            create: [
              { label: `Textbooks (Set of ${clsMeta.kitSetSize})`, icon: 'library_books', price: 85.00, position: 0 },
              { label: 'Workbooks (Semester 1)', icon: 'edit_note', price: 12.50, position: 1 },
              { label: 'Notebooks (Lined/Grid)', icon: 'subject', price: 4.75, position: 2 },
            ],
          },
        },
      })
    }
  }

  // ── Book Stock ────────────────────────────────────────────────────────────────
  const allBookItems = await prisma.bookKitItem.findMany()
  for (const item of allBookItems) {
    for (const branch of [mainBranch, branchA, branchB, branchC]) {
      await prisma.bookStock.upsert({
        where: { itemId_branchId: { itemId: item.id, branchId: branch.id } },
        update: {},
        create: {
          itemId: item.id,
          branchId: branch.id,
          quantity: branch.type === 'MAIN' ? 500 : Math.floor(80 + Math.random() * 200),
          tone: 'NORMAL',
        },
      })
    }
  }

  // ── Uniform Categories & Sizes ────────────────────────────────────────────────
  const uniformData = [
    { name: 'shirt', label: 'Shirt', icon: 'apparel', sizes: [
      { code: 'XS', name: 'Extra Small', price: 18.50, reorderThreshold: 50 },
      { code: 'S', name: 'Small', price: 18.50, reorderThreshold: 50 },
      { code: 'M', name: 'Medium', price: 19.99, reorderThreshold: 50 },
      { code: 'L', name: 'Large', price: 19.99, reorderThreshold: 50 },
      { code: 'XL', name: 'Extra Large', price: 22.00, reorderThreshold: 50 },
      { code: 'XXL', name: 'Double Extra Large', price: 24.50, reorderThreshold: 50 },
    ]},
    { name: 'pant', label: 'Pant', icon: 'line_weight', sizes: [
      { code: '28', name: 'Waist 28', price: 22.00, reorderThreshold: 40 },
      { code: '30', name: 'Waist 30', price: 22.00, reorderThreshold: 40 },
      { code: '32', name: 'Waist 32', price: 24.00, reorderThreshold: 40 },
      { code: '34', name: 'Waist 34', price: 24.00, reorderThreshold: 40 },
    ]},
    { name: 'socks', label: 'Socks', icon: 'footprint', sizes: [
      { code: 'S', name: 'Small', price: 4.99, reorderThreshold: 100 },
      { code: 'M', name: 'Medium', price: 4.99, reorderThreshold: 100 },
      { code: 'L', name: 'Large', price: 5.99, reorderThreshold: 100 },
    ]},
  ]

  for (let ci = 0; ci < uniformData.length; ci++) {
    const { name, label, icon, sizes } = uniformData[ci]
    const cat = await prisma.uniformCategory.upsert({
      where: { name },
      update: {},
      create: { name, label, icon, position: ci },
    })
    for (let si = 0; si < sizes.length; si++) {
      const s = sizes[si]
      const sz = await prisma.uniformSize.upsert({
        where: { categoryId_code: { categoryId: cat.id, code: s.code } },
        update: {},
        create: { categoryId: cat.id, code: s.code, name: s.name, price: s.price, reorderThreshold: s.reorderThreshold, position: si },
      })
      for (const branch of [mainBranch, branchA, branchB, branchC]) {
        const qty = branch.type === 'MAIN' ? 1000 : Math.floor(50 + Math.random() * 800)
        await prisma.uniformStock.upsert({
          where: { sizeId_branchId: { sizeId: sz.id, branchId: branch.id } },
          update: {},
          create: { sizeId: sz.id, branchId: branch.id, quantity: qty, tone: qty < s.reorderThreshold ? 'LOW' : 'NORMAL' },
        })
      }
    }
  }

  // ── Accessory Groups ─────────────────────────────────────────────────────────
  const accessoryGroups = [
    { name: 'bags', label: 'Bags & Backpacks', icon: 'backpack', items: [
      { sku: 'BAG-001', name: 'Standard Backpack', label: 'Standard Backpack', price: 25.00 },
      { sku: 'BAG-002', name: 'Premium Backpack', label: 'Premium Backpack', price: 45.00 },
    ]},
    { name: 'tech', label: 'Tech Accessories', icon: 'devices', items: [
      { sku: 'TECH-001', name: 'USB-C Cable', label: 'USB-C Cable', price: 8.00 },
    ]},
    { name: 'sports', label: 'Sports Add-ons', icon: 'sports_soccer', items: [
      { sku: 'SPT-001', name: 'Sports Kit', label: 'Sports Kit', price: 35.00 },
    ]},
  ]

  for (let gi = 0; gi < accessoryGroups.length; gi++) {
    const { name, label, icon, items } = accessoryGroups[gi]
    const grp = await prisma.accessoryGroup.upsert({
      where: { name },
      update: {},
      create: { name, label, icon, position: gi },
    })
    for (const item of items) {
      const acc = await prisma.accessory.upsert({
        where: { sku: item.sku },
        update: {},
        create: { groupId: grp.id, sku: item.sku, name: item.name, label: item.label, price: item.price },
      })
      for (const branch of [mainBranch, branchA, branchB, branchC]) {
        await prisma.accessoryStock.upsert({
          where: { accessoryId_branchId: { accessoryId: acc.id, branchId: branch.id } },
          update: {},
          create: { accessoryId: acc.id, branchId: branch.id, quantity: branch.type === 'MAIN' ? 200 : 30, tone: 'NORMAL' },
        })
      }
    }
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
