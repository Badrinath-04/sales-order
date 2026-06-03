/**
 * Seed Class 9 (34) & Class 10 (30) students — Narsingi, section A, 2026-27.
 * Run: node prisma/seed-narsingi-class9-10.js
 * Requires DATABASE_URL.
 */

require('dotenv/config')
const { PrismaClient } = require('@prisma/client')

const BRANCH_CODES = ['SVN_NARSINGI', 'CAMP-B']
const ACADEMIC_YEAR = '2026-27'
const SECTION = 'A'

const CLASS_9_STUDENTS = [
  { name: 'P Akshara', fatherName: 'P Prabhakar', phone: '7799771962' },
  { name: 'P Akshaya', fatherName: 'P Prabhakar', phone: '7799277196' },
  { name: 'V Dharani', fatherName: 'V Srisailam', phone: '9848762144' },
  { name: 'Y Gowthami', fatherName: 'Chennappa', phone: '9133844197' },
  { name: 'S Harika', fatherName: 'S Rama Krishna', phone: '8897991194' },
  { name: 'G Poojitha', fatherName: 'G Suresh', phone: '7567528205' },
  { name: 'M Sravya', fatherName: 'M Rajesh', phone: '9989528005' },
  { name: 'S Shruthika', fatherName: 'S Bala Chandrudu', phone: '9096267895' },
  { name: 'P Shruthi', fatherName: 'P Mallesh', phone: '9908090045' },
  { name: 'Syeda Noorin Faiz', fatherName: 'Syed Shabbir', phone: '9908224927' },
  { name: 'B Tejaswani', fatherName: 'B Sri Ram Nayak', phone: '9959332811' },
  { name: 'G Vaishali', fatherName: 'G Sathyam', phone: '7036484909' },
  { name: 'K Varnasri', fatherName: 'K Venkatesh', phone: '9705232651' },
  { name: 'G Akshith', fatherName: 'G Sanjeeva', phone: '9010570323' },
  { name: 'MD Amaanuddin', fatherName: 'MD Azeemuddin', phone: '6302561795' },
  { name: 'M Deekshith', fatherName: 'M Sanjay', phone: '8790989376' },
  { name: 'Dev Tiwari', fatherName: 'Mahendra Tiwari', phone: '9669836953' },
  { name: 'Sk Faizuddin', fatherName: 'SK Nayeemuddin', phone: '9949690297' },
  { name: 'M Hemesh Kumar', fatherName: 'M Krishna', phone: '9394777367' },
  { name: 'B Jagadeesh', fatherName: 'B Satish', phone: '9948355040' },
  { name: 'B Manikanta', fatherName: 'Anjaneyulu', phone: '9908143457' },
  { name: 'CH Rithvik', fatherName: 'Ch Ajay Kumar', phone: '8019843728' },
  { name: 'R Revanth', fatherName: 'R Sri Ramulu', phone: '8125350286' },
  { name: 'CH Saikrishna', fatherName: 'Ch Bhaskara Chary', phone: '6303494144' },
  { name: 'D Sakshith', fatherName: 'D Srinivas', phone: '9989673351' },
  { name: 'K Sathwik', fatherName: 'K Mahender', phone: '9848998397' },
  { name: 'M Sai Nikhilesh', fatherName: 'M Sridar', phone: '8686232722' },
  { name: 'M SreeCharan', fatherName: 'M Narsimhulu', phone: '8686232722' },
  { name: 'P Srikar', fatherName: 'P Sateesh', phone: '8019749345' },
  { name: 'M William Son', fatherName: 'M Poshaiah', phone: '9666843969' },
  { name: 'CH Yashwanth', fatherName: 'Ch Anjaneyulu', phone: '9951628468' },
  { name: 'P Yashwanth', fatherName: 'P Srinivasulu', phone: '9949226369' },
  { name: 'Zeeshan', fatherName: 'Shaik Zabeeh', phone: '8247533056' },
  { name: 'Kushal' },
]

const CLASS_10_STUDENTS = [
  { name: 'K. Jahnavi', fatherName: 'Sudesh', phone: '8919804563' },
  { name: 'M. Jahnavi', fatherName: 'Krishna', phone: '9394777367' },
  { name: 'K. Karthika', fatherName: 'Prabhakar', phone: '9951924889' },
  { name: 'A. Pravalika', fatherName: 'A. Anjaneyulu', phone: '9989379104' },
  { name: 'J. Pravalika', fatherName: 'J. Krishna', phone: '9573113040' },
  { name: 'S. Srivani', fatherName: 'Sanjeeva', phone: '9949686991' },
  { name: 'G. Sneha', fatherName: 'Bimesh', phone: '8328664272' },
  { name: 'K. Shriya', fatherName: 'K. Srikanth', phone: '8374626078' },
  { name: 'L. Shara', fatherName: 'Shankar Nayak', phone: '9392860170' },
  { name: 'J. Vandana', fatherName: 'Bikshapathi', phone: '9550596834' },
  { name: 'Zeenath Banu', fatherName: 'Hazrath', phone: '9100717830' },
  { name: 'V. Manaswini', fatherName: 'Ganesh', phone: '9705087473' },
  { name: 'Sandhya Rani', fatherName: 'Srinivas', phone: '9110349918' },
  { name: 'Sthotranjali', fatherName: 'Karunakar', phone: '9392577690' },
  { name: 'M. Bharath Chandra', fatherName: 'Machiraiah', phone: '9652981264' },
  { name: 'Naveen', fatherName: 'Narender', phone: '8106594358' },
  { name: 'L. Sharan', fatherName: 'Dayanand', phone: '9963885445' },
  { name: 'Ganesh', fatherName: 'Vinod Kumar', phone: '7569985025' },
  { name: 'P. Rudra', fatherName: 'Vijay Kumar', phone: '9640930388' },
  { name: 'Thanush Raj', fatherName: 'Sridhar', phone: '9542463540' },
  { name: 'Varun', fatherName: 'Nagesh', phone: '9849911605' },
  { name: 'T. Venkat Sai', fatherName: 'Narender', phone: '9603358953' },
  { name: 'Venkat Sagar', fatherName: 'Mallesh', phone: '9440714822' },
  { name: 'William', fatherName: 'Pochaiah', phone: '9550863141' },
  { name: 'Raj Nandini', fatherName: 'Kanhayya', phone: '8008160583' },
  { name: 'Lavanya', fatherName: 'Krishna', phone: '9702555843' },
  { name: 'G Sachith', fatherName: 'Rajashekar', phone: '9849246086' },
  { name: 'Sai Venkata Ramana', fatherName: 'Satya Narayana', phone: '8897977953' },
  { name: 'Sandeep Kumavath', fatherName: 'Chutraram Kumavath', phone: '7337463065' },
  { name: 'K. Sudheer', fatherName: 'K. Naveen', phone: '8341160999' },
]

const prisma = new PrismaClient()

function toInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'NA'
  const joined = parts
    .map((p) => (p[0] ? p[0] : ''))
    .join('')
    .toUpperCase()
  return joined.slice(0, 4) || parts[0].slice(0, 2).toUpperCase() || 'NA'
}

function normalizePhoneTo10DigitString(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

function rollNumber(branchCode, grade, index) {
  return `${branchCode}-${grade}-${SECTION}-${String(index).padStart(3, '0')}`
}

function classLabelForGrade(grade) {
  return `Class ${grade}`
}

async function ensureClass(tx, branchId, grade) {
  await tx.academicClass.upsert({
    where: {
      grade_section_branchId_academicYear: {
        grade,
        section: SECTION,
        branchId,
        academicYear: ACADEMIC_YEAR,
      },
    },
    update: { label: `${classLabelForGrade(grade)}-${SECTION}` },
    create: {
      grade,
      section: SECTION,
      label: `${classLabelForGrade(grade)}-${SECTION}`,
      branchId,
      academicYear: ACADEMIC_YEAR,
      studentCount: 0,
    },
  })
}

async function recomputeStudentCounts(tx, branchId) {
  const counts = await tx.students.groupBy({
    by: ['classId'],
    where: { class: { branchId, academicYear: ACADEMIC_YEAR }, isActive: true },
    _count: { _all: true },
  })
  const classes = await tx.academicClass.findMany({
    where: { branchId, academicYear: ACADEMIC_YEAR },
    select: { id: true },
  })
  const countByClass = new Map(counts.map((c) => [c.classId, c._count._all]))
  for (const cls of classes) {
    await tx.academicClass.update({
      where: { id: cls.id },
      data: { studentCount: countByClass.get(cls.id) ?? 0 },
    })
  }
}

async function countStudentsInClass(classId) {
  return prisma.students.count({ where: { classId, isActive: true } })
}

function buildStudentRows(rows, grade, classId, branchCode) {
  return rows.map((row, i) => ({
    classId,
    name: String(row.name).trim(),
    rollNumber: rollNumber(branchCode, grade, i + 1),
    initials: toInitials(row.name),
    guardianName: row.fatherName?.trim() || null,
    guardianPhone: normalizePhoneTo10DigitString(row.phone),
    isActive: true,
  }))
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  const branch = await prisma.branch.findFirst({
    where: {
      code: { in: BRANCH_CODES },
      deletedAt: null,
      isActive: true,
    },
  })
  if (!branch) {
    throw new Error(`Narsingi branch not found (tried codes: ${BRANCH_CODES.join(', ')})`)
  }

  console.log(`Branch: ${branch.name} (${branch.code})`)
  console.log(`Academic year: ${ACADEMIC_YEAR}`)

  await prisma.$transaction(async (tx) => {
    await ensureClass(tx, branch.id, 9)
    await ensureClass(tx, branch.id, 10)

    const classes = await tx.academicClass.findMany({
      where: {
        branchId: branch.id,
        academicYear: ACADEMIC_YEAR,
        grade: { in: [9, 10] },
        section: SECTION,
      },
      select: { id: true, grade: true },
    })

    const class9 = classes.find((c) => c.grade === 9)
    const class10 = classes.find((c) => c.grade === 10)
    if (!class9 || !class10) {
      throw new Error(`Class 9 or Class 10 section ${SECTION} not found for ${branch.code}`)
    }

    const before9 = await tx.students.count({
      where: { class: { branchId: branch.id, academicYear: ACADEMIC_YEAR, grade: 9 } },
    })
    const before10 = await tx.students.count({
      where: { class: { branchId: branch.id, academicYear: ACADEMIC_YEAR, grade: 10 } },
    })
    console.log(`Before delete — Class 9 (all sections): ${before9}, Class 10: ${before10}`)

    const existing = await tx.students.findMany({
      where: {
        class: {
          branchId: branch.id,
          academicYear: ACADEMIC_YEAR,
          grade: { in: [9, 10] },
        },
      },
      select: { id: true },
    })
    const studentIds = existing.map((s) => s.id)

    if (studentIds.length) {
      const orders = await tx.order.findMany({
        where: { studentId: { in: studentIds } },
        select: { id: true },
      })
      const orderIds = orders.map((o) => o.id)
      if (orderIds.length) {
        await tx.transaction.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await tx.students.deleteMany({ where: { id: { in: studentIds } } })
    }

    console.log(`Deleted ${studentIds.length} existing student(s) in Class 9 & 10`)

    const toCreate = [
      ...buildStudentRows(CLASS_9_STUDENTS, 9, class9.id, branch.code),
      ...buildStudentRows(CLASS_10_STUDENTS, 10, class10.id, branch.code),
    ]

    const created = await tx.students.createMany({ data: toCreate })
    console.log(`Seeded ${created.count} students (Class 9: ${CLASS_9_STUDENTS.length}, Class 10: ${CLASS_10_STUDENTS.length})`)

    await recomputeStudentCounts(tx, branch.id)
  })

  const classes = await prisma.academicClass.findMany({
    where: {
      branchId: branch.id,
      academicYear: ACADEMIC_YEAR,
      grade: { in: [9, 10] },
      section: SECTION,
    },
    select: { grade: true, id: true },
  })

  const class9 = classes.find((c) => c.grade === 9)
  const class10 = classes.find((c) => c.grade === 10)

  const final9 = class9 ? await countStudentsInClass(class9.id) : 0
  const final10 = class10 ? await countStudentsInClass(class10.id) : 0

  console.log('\n=== Verification ===')
  console.log(`Class 9-${SECTION} count: ${final9} (expected 34)`)
  console.log(`Class 10-${SECTION} count: ${final10} (expected 30)`)

  if (final9 !== 34 || final10 !== 30) {
    throw new Error(`Verification failed — Class 9: ${final9}, Class 10: ${final10}`)
  }

  console.log('✓ Seed complete and verified.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
