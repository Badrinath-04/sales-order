const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')

const prisma = new PrismaClient()

const FILE_NUR_TO_V = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/Nur to V-darga-final.xlsx'
const FILE_VI_TO_X = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/Darga_VI to X.xlsx'

async function deleteZeroStudentClassesForYear(db, branchId, academicYear) {
  const classes = await db.academicClass.findMany({
    where: { branchId, academicYear },
    select: {
      id: true,
      _count: { select: { students: true } },
    },
  })

  const zeroIds = classes.filter((c) => c._count.students === 0).map((c) => c.id)
  if (!zeroIds.length) return 0

  // These classes can still have BookKits/Items/Stock created earlier. Delete in FK-safe order.
  await db.$transaction(async (tx) => {
    const kits = await tx.bookKit.findMany({ where: { classId: { in: zeroIds } }, select: { id: true } })
    const kitIds = kits.map((k) => k.id)
    const items = await tx.bookKitItem.findMany({ where: { kitId: { in: kitIds } }, select: { id: true } })
    const itemIds = items.map((i) => i.id)

    if (itemIds.length) await tx.bookStock.deleteMany({ where: { itemId: { in: itemIds } } })
    if (kitIds.length) await tx.bookKitItem.deleteMany({ where: { kitId: { in: kitIds } } })
    if (kitIds.length) await tx.bookKit.deleteMany({ where: { id: { in: kitIds } } })

    await tx.academicClass.deleteMany({ where: { id: { in: zeroIds } } })
  })

  return zeroIds.length
}

function normalizeClassLabel(raw) {
  const v = String(raw ?? '').trim()
  if (!v) return ''
  return v.replace(/\s+/g, '')
}

function normalizeSection(raw) {
  const v = String(raw ?? '').trim().toUpperCase()
  if (!v) return ''
  return v
}

function classToGradeInt(cls) {
  const c = normalizeClassLabel(cls).toUpperCase()
  if (c === 'LKG') return -1
  if (c === 'UKG') return 0

  const roman = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  }
  if (roman[c] !== undefined) return roman[c]

  const n = Number.parseInt(c, 10)
  if (Number.isFinite(n)) return n
  throw new Error(`Unrecognized class value: "${cls}"`)
}

function gradeToExpectedPrefix(grade) {
  if (grade === -1) return 'LKG'
  if (grade === 0) return 'UKG'
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  if (grade >= 1 && grade <= 10) return `Class ${roman[grade - 1]}`
  return `Grade ${grade}`
}

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

  let n
  if (typeof raw === 'number') n = raw
  else n = Number(String(raw).trim())

  if (!Number.isFinite(n)) return null

  const intVal = Math.trunc(n)
  let digits = String(intVal).replace(/\D/g, '')
  if (!digits) return null

  if (digits.length > 10) digits = digits.slice(-10)
  if (digits.length < 10) digits = digits.padStart(10, '0')
  return digits
}

function readExcelRows(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { cellDates: false })
  const name = sheetName || wb.SheetNames[0]
  const ws = wb.Sheets[name]
  if (!ws) throw new Error(`Sheet "${name}" not found in ${filePath}`)

  const json = XLSX.utils.sheet_to_json(ws, { defval: null })
  return json
}

function pickField(row, candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c]
  }
  return null
}

async function main() {
  console.log('Darga seeding started.')

  const darga = await prisma.branch.findFirst({
    where: { code: 'CAMP-A' },
  })
  if (!darga) throw new Error('Darga branch not found (expected Branch.code = "CAMP-A").')

  // Seed into the "current" year requested.
  const academicYear = '2026-27'
  console.log(`Target academicYear=${academicYear}`)

  const removedBefore = await deleteZeroStudentClassesForYear(prisma, darga.id, academicYear)
  if (removedBefore) console.log(`Removed ${removedBefore} zero-student duplicate sections before seeding.`)

  // Ensure required Darga classes exist for the target year (only the sections we actually seed).
  const requiredPairs = [
    { grade: -1, section: 'A' },
    { grade: -1, section: 'B' },
    { grade: 0, section: 'A' },
    { grade: 0, section: 'B' },
    { grade: 1, section: 'A' },
    { grade: 1, section: 'B' },
    { grade: 2, section: 'A' },
    { grade: 2, section: 'B' },
    { grade: 2, section: 'C' },
    { grade: 3, section: 'A' },
    { grade: 3, section: 'B' },
    { grade: 4, section: 'A' },
    { grade: 4, section: 'B' },
    { grade: 5, section: 'A' },
    { grade: 5, section: 'B' },
    { grade: 6, section: 'A' },
    { grade: 6, section: 'B' },
    { grade: 7, section: 'A' },
    { grade: 7, section: 'B' },
    { grade: 7, section: 'C' },
    { grade: 8, section: 'A' },
    { grade: 8, section: 'B' },
    { grade: 8, section: 'C' },
    { grade: 9, section: 'A' },
    { grade: 9, section: 'B' },
    { grade: 9, section: 'C' },
    { grade: 10, section: 'A' },
    { grade: 10, section: 'B' },
  ]

  function classLabelForGradeLocal(grade) {
    if (grade === -1) return 'LKG'
    if (grade === 0) return 'UKG'
    if (grade >= 1 && grade <= 10) return `Class ${grade}`
    return `Grade ${grade}`
  }

  console.log('Ensuring AcademicClass rows exist for Darga (2026-27)...')
  for (const pair of requiredPairs) {
    const grade = pair.grade
    const section = pair.section
    await prisma.academicClass.upsert({
      where: {
        grade_section_branchId_academicYear: { grade, section, branchId: darga.id, academicYear },
      },
      update: { label: `${classLabelForGradeLocal(grade)}-${section}` },
      create: {
        grade,
        section,
        label: `${classLabelForGradeLocal(grade)}-${section}`,
        branchId: darga.id,
        academicYear,
        studentCount: 0,
      },
    })
  }

  const classes = await prisma.academicClass.findMany({
    where: { branchId: darga.id, academicYear },
    select: { id: true, grade: true, section: true },
  })

  const classIdByGradeSection = new Map()
  for (const c of classes) {
    classIdByGradeSection.set(`${c.grade}:${c.section.toUpperCase()}`, c.id)
  }

  const rows1 = readExcelRows(FILE_NUR_TO_V)
  const rows2 = readExcelRows(FILE_VI_TO_X, 'Sheet1')
  console.log(`Loaded rows: file1=${rows1.length}, file2=${rows2.length}`)

  const rawRows = [
    ...rows1.map((r) => ({ source: 'file1', row: r })),
    ...rows2.map((r) => ({ source: 'file2', row: r })),
  ]

  const studentsToCreate = []
  const perClassCounter = new Map() // classId -> next counter

  for (const { source, row } of rawRows) {
    const studentName = pickField(row, ['Student Name', 'Student Name ', 'StudentName', 'student_name', 'Name'])
    const fatherName = pickField(row, ['Father Name', 'FatherName', 'father_name', 'Parent Name'])
    const contactNo = pickField(row, ['Contact No', 'Contact No.', 'Contact', 'ContactNo', 'Phone', 'Mobile'])
    const classVal = pickField(row, ['Class', 'Class ', 'CLASS', 'class'])
    const sectionVal = pickField(row, ['Section', 'Sec', 'SECTION', 'section'])

    const name = String(studentName ?? '').trim()
    const guardianName = fatherName === null || fatherName === undefined ? null : String(fatherName).trim() || null
    const section = normalizeSection(sectionVal)
    if (!name && (classVal === null || classVal === undefined) && (sectionVal === null || sectionVal === undefined)) {
      continue
    }
    if (!name) {
      throw new Error(
        `Found a row with class/section but missing Student Name (${source}). ` +
          `Class="${String(classVal ?? '').trim()}" Section="${String(sectionVal ?? '').trim()}". ` +
          `Please fix the Excel (blank student row) and re-run.`,
      )
    }
    const grade = classToGradeInt(classVal)

    if (!name) continue
    if (!section) throw new Error(`Missing section for student "${name}" (${source}).`)

    const classId = classIdByGradeSection.get(`${grade}:${section}`)
    if (!classId) {
      throw new Error(`No AcademicClass found for Darga grade=${grade}, section=${section} (student "${name}").`)
    }

    const phone = normalizePhoneTo10DigitString(contactNo)

    const current = perClassCounter.get(classId) ?? 0
    const next = current + 1
    perClassCounter.set(classId, next)

    const rollNumber = `${darga.code}-${grade}-${section}-${String(next).padStart(3, '0')}`

    studentsToCreate.push({
      classId,
      name,
      rollNumber,
      initials: toInitials(name),
      guardianName,
      guardianPhone: phone,
      isActive: true,
    })
  }

  if (studentsToCreate.length !== 885) {
    throw new Error(`Expected 885 students from Excel, got ${studentsToCreate.length}. Refusing to seed.`)
  }

  console.log(`Deleting existing Darga students for academicYear=${academicYear}...`)
  await prisma.students.deleteMany({
    where: { class: { branchId: darga.id, academicYear } },
  })

  console.log('Inserting students...')
  const created = await prisma.students.createMany({
    data: studentsToCreate,
  })
  console.log(`Inserted rows: ${created.count}`)

  console.log(`Recomputing AcademicClass.studentCount for Darga academicYear=${academicYear}...`)
  const counts = await prisma.students.groupBy({
    by: ['classId'],
    where: { class: { branchId: darga.id, academicYear }, isActive: true },
    _count: { _all: true },
  })
  for (const c of counts) {
    await prisma.academicClass.update({
      where: { id: c.classId },
      data: { studentCount: c._count._all },
    })
  }

  console.log('Verifying class/section breakdown...')
  const classCounts = await prisma.academicClass.findMany({
    where: { branchId: darga.id, academicYear },
    select: {
      grade: true,
      section: true,
      _count: { select: { students: true } },
    },
  })

  const actual = new Map()
  for (const c of classCounts) {
    const key = `${gradeToExpectedPrefix(c.grade)}-${c.section.toUpperCase()}`
    actual.set(key, c._count.students)
  }

  const expected = new Map([
    ['LKG-A', 34],
    ['LKG-B', 31],
    ['UKG-A', 33],
    ['UKG-B', 34],
    ['Class I-A', 37],
    ['Class I-B', 38],
    ['Class II-A', 27],
    ['Class II-B', 26],
    ['Class II-C', 26],
    ['Class III-A', 30],
    ['Class III-B', 31],
    ['Class IV-A', 24],
    ['Class IV-B', 21],
    ['Class V-A', 38],
    ['Class V-B', 34],
    ['Class VI-A', 38],
    ['Class VI-B', 38],
    ['Class VII-A', 32],
    ['Class VII-B', 31],
    ['Class VII-C', 31],
    ['Class VIII-A', 28],
    ['Class VIII-B', 29],
    ['Class VIII-C', 28],
    ['Class IX-A', 32],
    ['Class IX-B', 33],
    ['Class IX-C', 29],
    ['Class X-A', 37],
    ['Class X-B', 35],
  ])

  const mismatches = []
  let expectedTotal = 0
  let actualTotal = 0

  for (const [k, v] of expected.entries()) {
    expectedTotal += v
    const got = actual.get(k) ?? 0
    actualTotal += got
    if (got !== v) mismatches.push({ key: k, expected: v, actual: got })
  }

  if (expectedTotal !== 885) throw new Error(`Internal expectedTotal mismatch: ${expectedTotal}`)

  if (mismatches.length) {
    console.error('Count mismatches found:')
    for (const m of mismatches) console.error(`${m.key}: expected ${m.expected}, got ${m.actual}`)
    throw new Error('Seed completed but verification failed. See mismatches above.')
  }

  if (actualTotal !== 885) {
    throw new Error(`Verification total mismatch: expected 885, got ${actualTotal}`)
  }

  console.log('Darga seeding complete. All counts match (885).')

  const removedAfter = await deleteZeroStudentClassesForYear(prisma, darga.id, academicYear)
  if (removedAfter) console.log(`Removed ${removedAfter} zero-student duplicate sections after seeding.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

