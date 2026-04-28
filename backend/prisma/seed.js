const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

function gradeCode(grade) {
  return grade < 0 ? `N${Math.abs(grade)}` : String(grade)
}

function getBookItemType(label = '') {
  const lower = label.toLowerCase()
  if (lower.includes('textbook')) return 'TEXTBOOK'
  if (lower.includes('workbook')) return 'WORKBOOK'
  if (lower.includes('notebook')) return 'NOTEBOOK'
  return 'GENERAL'
}

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
      for (const section of sections) {
        const cls = await prisma.academicClass.findFirst({
          where: { grade: clsMeta.grade, section, branchId: branch.id, academicYear: '2024-25' },
        })
        if (!cls) continue

        const kit = await prisma.bookKit.upsert({
          where: { classId: cls.id },
          update: {
            label: `${clsMeta.label} Kit Details`,
            badge: 'Academic Kit',
          },
          create: {
            classId: cls.id,
            label: `${clsMeta.label} Kit Details`,
            badge: 'Academic Kit',
          },
        })

        const standardItems = [
          { key: 'textbook', label: `Textbooks (Set of ${clsMeta.kitSetSize})`, icon: 'library_books', price: 85.00, position: 0 },
          { key: 'workbook', label: 'Workbooks (Semester 1)', icon: 'edit_note', price: 12.50, position: 1 },
          { key: 'notebook', label: 'Notebooks (Lined/Grid)', icon: 'subject', price: 4.75, position: 2 },
        ]

        for (const stdItem of standardItems) {
          const labelFilter =
            stdItem.key === 'textbook'
              ? { startsWith: 'Textbooks' }
              : { equals: stdItem.label }

          const existingItem = await prisma.bookKitItem.findFirst({
            where: { kitId: kit.id, label: labelFilter },
          })

          if (existingItem) {
            await prisma.bookKitItem.update({
              where: { id: existingItem.id },
              data: {
                label: stdItem.label,
                icon: stdItem.icon,
                price: stdItem.price,
                position: stdItem.position,
              },
            })
          } else {
            await prisma.bookKitItem.create({
              data: {
                kitId: kit.id,
                label: stdItem.label,
                icon: stdItem.icon,
                price: stdItem.price,
                position: stdItem.position,
              },
            })
          }
        }
      }
    }
  }

  // ── Students (Darga: richer data, others: minimum one per section) ────────────
  const allAcademicClasses = await prisma.academicClass.findMany({
    where: {
      branchId: { in: [branchA.id, branchB.id, branchC.id] },
      academicYear: '2024-25',
    },
    include: {
      branch: { select: { code: true, name: true } },
    },
  })

  for (const cls of allAcademicClasses) {
    const studentsNeeded = cls.branch.code === 'CAMP-A' ? 5 : 1
    const gradeLabel = gradeCode(cls.grade)

    for (let index = 1; index <= studentsNeeded; index += 1) {
      const rollNumber = `${cls.branch.code}-${gradeLabel}${cls.section}-${String(index).padStart(2, '0')}`
      const studentName = `${cls.branch.name} ${gradeLabel}-${cls.section} Student ${index}`
      const guardianName = `Guardian ${gradeLabel}${cls.section}${index}`
      const guardianPhone = `90000${String(Math.abs(cls.grade) * 1000 + cls.section.charCodeAt(0) * 10 + index).padStart(5, '0')}`

      await prisma.students.upsert({
        where: { rollNumber_classId: { rollNumber, classId: cls.id } },
        update: {
          name: studentName,
          initials: studentName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 4)
            .toUpperCase(),
          guardianName,
          guardianPhone,
          isActive: true,
        },
        create: {
          classId: cls.id,
          rollNumber,
          name: studentName,
          initials: studentName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 4)
            .toUpperCase(),
          guardianName,
          guardianPhone,
          isActive: true,
        },
      })
    }

    const studentCount = await prisma.students.count({
      where: { classId: cls.id, isActive: true },
    })

    await prisma.academicClass.update({
      where: { id: cls.id },
      data: { studentCount },
    })
  }

  // ── Book Stock ────────────────────────────────────────────────────────────────
  const branchStudentCounts = {
    [branchA.id]: await prisma.students.count({ where: { class: { branchId: branchA.id }, isActive: true } }),
    [branchB.id]: await prisma.students.count({ where: { class: { branchId: branchB.id }, isActive: true } }),
    [branchC.id]: await prisma.students.count({ where: { class: { branchId: branchC.id }, isActive: true } }),
  }

  const totalBranchStudents = branchStudentCounts[branchA.id] + branchStudentCounts[branchB.id] + branchStudentCounts[branchC.id]

  const allBookItems = await prisma.bookKitItem.findMany()
  for (const item of allBookItems) {
    const itemType = getBookItemType(item.label)
    const perStudentFactor = itemType === 'TEXTBOOK' ? 1.2 : itemType === 'WORKBOOK' ? 1.0 : itemType === 'NOTEBOOK' ? 2.0 : 1.0

    for (const branch of [mainBranch, branchA, branchB, branchC]) {
      const branchStudents = branch.id === mainBranch.id ? totalBranchStudents : branchStudentCounts[branch.id] ?? 0
      const quantity = branch.id === mainBranch.id
        ? Math.max(300, Math.ceil(branchStudents * perStudentFactor * 1.5))
        : Math.max(25, Math.ceil(branchStudents * perStudentFactor))

      await prisma.bookStock.upsert({
        where: { itemId_branchId: { itemId: item.id, branchId: branch.id } },
        update: {
          quantity,
          tone: quantity < 20 ? 'LOW' : 'NORMAL',
        },
        create: {
          itemId: item.id,
          branchId: branch.id,
          quantity,
          tone: quantity < 20 ? 'LOW' : 'NORMAL',
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
