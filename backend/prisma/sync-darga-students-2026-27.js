const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')

const prisma = new PrismaClient()

const BRANCH_CODE = 'CAMP-A' // Darga
const ACADEMIC_YEAR = '2026-27'

// Updated files provided by user
const FILE_NUR_TO_V = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/Darga/Nur to V_updated.xlsx'
const FILE_VI_TO_X = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/Darga/VI to X_updated.xlsx'

function normalizeClassLabel(raw) {
  const v = String(raw ?? '').trim()
  return v.replace(/\s+/g, '')
}

function normalizeSection(raw) {
  const v = String(raw ?? '').trim().toUpperCase()
  return v
}

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === ''
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

function toInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'NA'
  return (
    parts
      .map((p) => (p[0] ? p[0] : ''))
      .join('')
      .toUpperCase()
      .slice(0, 4) || 'NA'
  )
}

/**
 * Darga rule: normalize to a 10-digit string (pad/truncate) or null.
 */
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

function pickField(row, candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c]
  }
  return null
}

function readExcelRows(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { cellDates: false })
  const name = sheetName || wb.SheetNames[0]
  const ws = wb.Sheets[name]
  if (!ws) throw new Error(`Sheet "${name}" not found in ${filePath}`)
  return XLSX.utils.sheet_to_json(ws, { defval: null, blankrows: true })
}

function makeIdentityKey({ grade, section, name, guardianName, guardianPhone }) {
  // Strict key: same class/section + same exact strings after trimming.
  return [
    String(grade),
    section,
    name,
    guardianName ?? '',
    guardianPhone ?? '',
  ].join('|')
}

function parseExistingSeq(rollNumber, grade, section) {
  // Expected format from our seeding: CAMP-A-<grade>-<section>-NNN
  const re = new RegExp(`^${BRANCH_CODE}-${grade}-${section}-(\\d{3})$`)
  const m = String(rollNumber ?? '').match(re)
  if (!m) return null
  return Number.parseInt(m[1], 10)
}

async function main() {
  console.log(`Darga sync started (branch=${BRANCH_CODE}, year=${ACADEMIC_YEAR})`)

  const branch = await prisma.branch.findFirst({ where: { code: BRANCH_CODE } })
  if (!branch) throw new Error(`Branch not found: ${BRANCH_CODE}`)

  const existingStudents = await prisma.students.findMany({
    where: { class: { branchId: branch.id, academicYear: ACADEMIC_YEAR } },
    select: {
      id: true,
      name: true,
      guardianName: true,
      guardianPhone: true,
      rollNumber: true,
      class: { select: { id: true, grade: true, section: true } },
    },
  })

  const beforeTotal = existingStudents.length
  console.log(`DB students before: ${beforeTotal}`)

  const existingKeySet = new Set(
    existingStudents.map((s) =>
      makeIdentityKey({
        grade: s.class.grade,
        section: s.class.section.toUpperCase(),
        name: s.name,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
      }),
    ),
  )

  // Load classes for mapping (must already exist; we create missing if needed)
  const classes = await prisma.academicClass.findMany({
    where: { branchId: branch.id, academicYear: ACADEMIC_YEAR },
    select: { id: true, grade: true, section: true },
  })
  const classIdByGradeSection = new Map()
  for (const c of classes) classIdByGradeSection.set(`${c.grade}:${c.section.toUpperCase()}`, c.id)

  const report = {
    excelTotal: 0,
    duplicatesInExcel: 0,
    invalidRows: 0,
    missingInserted: 0,
    alreadyPresent: 0,
    insertedByBucket: new Map(),
    dbCountsAfter: new Map(),
  }

  // Parse Excel rows from both files
  const rows1 = readExcelRows(FILE_NUR_TO_V)
  const rows2 = readExcelRows(FILE_VI_TO_X, 'Sheet1')
  const allRows = [
    ...rows1.map((row) => ({ source: 'nur_to_v', row })),
    ...rows2.map((row) => ({ source: 'vi_to_x', row })),
  ]

  const excelKeySet = new Set()
  const candidates = []

  for (const { source, row } of allRows) {
    const studentName = pickField(row, ['Student Name', 'Student Name ', 'StudentName', 'NAME', 'Name'])
    const fatherName = pickField(row, ['Father Name', 'Father Name ', 'FatherName', 'Parent Name'])
    const contactNo = pickField(row, ['Contact No', 'Contact No.', 'Contact', 'ContactNo', 'Contact Number', 'Phone', 'Mobile'])
    const classVal = pickField(row, ['Class', 'Class ', 'CLASS', 'class'])
    const sectionVal = pickField(row, ['Section', 'Sec', 'SECTION', 'section'])

    const name = String(studentName ?? '').trim()
    const section = normalizeSection(sectionVal)

    const emptyRow =
      isBlank(name) &&
      isBlank(fatherName) &&
      isBlank(contactNo) &&
      isBlank(classVal) &&
      isBlank(sectionVal)
    if (emptyRow) continue

    if (!name || !classVal || !section) {
      report.invalidRows += 1
      continue
    }

    const grade = classToGradeInt(classVal)
    const guardianName = isBlank(fatherName) ? null : String(fatherName).trim() || null
    const guardianPhone = normalizePhoneTo10DigitString(contactNo)

    const key = makeIdentityKey({ grade, section, name, guardianName, guardianPhone })
    report.excelTotal += 1

    if (excelKeySet.has(key)) {
      report.duplicatesInExcel += 1
      continue
    }
    excelKeySet.add(key)

    candidates.push({ grade, section, name, guardianName, guardianPhone, source })
  }

  // Determine missing students
  const missing = candidates.filter((c) => !existingKeySet.has(makeIdentityKey(c)))

  // Precompute next roll sequences per classId based on existing seeded pattern
  const nextSeqByClassId = new Map()
  for (const cls of classes) {
    const inClass = existingStudents.filter((s) => s.class.id === cls.id)
    let maxSeq = 0
    for (const s of inClass) {
      const seq = parseExistingSeq(s.rollNumber, cls.grade, cls.section.toUpperCase())
      if (seq && seq > maxSeq) maxSeq = seq
    }
    nextSeqByClassId.set(cls.id, maxSeq + 1)
  }

  // Ensure classes exist for any new grade/section found in Excel
  // (We only create when Excel has that bucket.)
  for (const m of missing) {
    const key = `${m.grade}:${m.section}`
    if (classIdByGradeSection.has(key)) continue
    const label =
      m.grade === -1 ? `LKG-${m.section}` :
      m.grade === 0 ? `UKG-${m.section}` :
      `Class ${m.grade}-${m.section}`

    const created = await prisma.academicClass.upsert({
      where: {
        grade_section_branchId_academicYear: {
          grade: m.grade,
          section: m.section,
          branchId: branch.id,
          academicYear: ACADEMIC_YEAR,
        },
      },
      update: { label },
      create: { grade: m.grade, section: m.section, label, branchId: branch.id, academicYear: ACADEMIC_YEAR, studentCount: 0 },
      select: { id: true },
    })
    classIdByGradeSection.set(key, created.id)
    nextSeqByClassId.set(created.id, 1)
  }

  // Insert missing students (only)
  for (const m of missing) {
    const classId = classIdByGradeSection.get(`${m.grade}:${m.section}`)
    if (!classId) {
      report.invalidRows += 1
      continue
    }

    const seq = nextSeqByClassId.get(classId) ?? 1
    nextSeqByClassId.set(classId, seq + 1)

    const rollNumber = `${BRANCH_CODE}-${m.grade}-${m.section}-${String(seq).padStart(3, '0')}`

    await prisma.students.create({
      data: {
        classId,
        name: m.name,
        rollNumber,
        initials: toInitials(m.name),
        guardianName: m.guardianName,
        guardianPhone: m.guardianPhone,
        isActive: true,
      },
    })

    report.missingInserted += 1
    const bucket = `${m.grade}:${m.section}`
    report.insertedByBucket.set(bucket, (report.insertedByBucket.get(bucket) ?? 0) + 1)
  }

  // Recompute studentCount for all Darga classes for this year
  const counts = await prisma.students.groupBy({
    by: ['classId'],
    where: { class: { branchId: branch.id, academicYear: ACADEMIC_YEAR }, isActive: true },
    _count: { _all: true },
  })
  for (const c of counts) {
    await prisma.academicClass.update({ where: { id: c.classId }, data: { studentCount: c._count._all } })
  }

  const afterTotal = await prisma.students.count({
    where: { class: { branchId: branch.id, academicYear: ACADEMIC_YEAR } },
  })

  // Final class/section counts
  const classCounts = await prisma.academicClass.findMany({
    where: { branchId: branch.id, academicYear: ACADEMIC_YEAR },
    select: { grade: true, section: true, label: true, _count: { select: { students: true } } },
    orderBy: [{ grade: 'asc' }, { section: 'asc' }],
  })

  console.log('\n== Summary report ==')
  console.log(`DB before: ${beforeTotal}`)
  console.log(`Excel rows considered (non-empty & valid): ${report.excelTotal}`)
  console.log(`Duplicates within Excel skipped: ${report.duplicatesInExcel}`)
  console.log(`Invalid/partial rows skipped: ${report.invalidRows}`)
  console.log(`Newly inserted: ${report.missingInserted}`)
  console.log(`DB after: ${afterTotal}`)

  console.log('\n== Class/section counts (DB after) ==')
  for (const c of classCounts) {
    console.log(`${c.label}\tgrade=${c.grade}\tsec=${c.section}\tcount=${c._count.students}`)
  }

  if (report.insertedByBucket.size) {
    console.log('\n== Newly added by class/section ==')
    for (const [k, v] of report.insertedByBucket.entries()) {
      console.log(`${k}\t+${v}`)
    }
  }

  console.log('\nDarga sync complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

