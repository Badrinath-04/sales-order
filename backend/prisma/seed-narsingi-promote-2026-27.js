const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')

const prisma = new PrismaClient()

// Source files in repo
const FILE_1 = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/Narsingi_lkg to 8th.xlsx'
const FILE_2 = '/Users/badrinath/Campus-360-Pro/Books_Management_Erp/sales-order/data/narsingi 9th & 10th.xlsx'

const BRANCH_CODE = 'CAMP-B' // Narsingi
const TARGET_YEAR = '2026-27'

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === ''
}

function normalizeSection(raw) {
  const v = String(raw ?? '').trim().toUpperCase()
  return v
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

/**
 * Convert contact number to digits string.
 * Rule: do NOT pad/truncate; if not 10 digits, insert as-is and flag.
 */
function normalizePhoneDigits(raw) {
  if (isBlank(raw)) return { value: null, isTenDigits: true }

  // xlsx may provide numbers or strings
  let digits = ''
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return { value: null, isTenDigits: true }
    digits = String(Math.trunc(raw))
  } else {
    digits = String(raw).trim()
  }

  digits = digits.replace(/\D/g, '')
  if (!digits) return { value: null, isTenDigits: true }
  return { value: digits, isTenDigits: digits.length === 10 }
}

function readSheetRows(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName]
  if (!ws) throw new Error(`Sheet not found: "${sheetName}"`)

  // Preserve row order and keep blank rows so we can infer sections.
  return XLSX.utils.sheet_to_json(ws, { defval: null, blankrows: true })
}

function pickField(row, candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c]
  }
  return null
}

/**
 * Promotion mapping from old class (sheet or file2 class) to target grade int.
 * Grades in DB:
 * -2 Nursery, -1 LKG, 0 UKG, 1..10 Class 1..10
 */
function promotedGradeFromOld(old) {
  const v = String(old).trim().toUpperCase()
  if (v === 'NURSERY') return -1
  if (v === 'LKG') return 0
  if (v === 'UKG') return 1
  if (v === 'I' || v === '1' || v === 'CLASS I') return 2
  if (v === 'II' || v === '2' || v === 'CLASS II') return 3
  if (v === 'III' || v === '3' || v === 'CLASS III') return 4
  if (v === 'IV' || v === '4' || v === 'CLASS IV') return 5
  if (v === 'V' || v === '5' || v === 'CLASS V') return 6
  if (v === 'VI' || v === '6' || v === 'CLASS VI') return 7
  if (v === 'VII' || v === '7' || v === 'CLASS VII') return 8
  if (v === 'VIII' || v === '8' || v === 'CLASS VIII') return 9
  if (v === 'IX' || v === '9' || v === 'CLASS IX') return 10
  throw new Error(`Unknown old class for promotion: "${old}"`)
}

function labelForGrade(grade) {
  if (grade === -2) return 'Nursery'
  if (grade === -1) return 'LKG'
  if (grade === 0) return 'UKG'
  if (grade >= 1 && grade <= 10) return `Class ${grade}`
  return `Grade ${grade}`
}

async function ensureClass(tx, branchId, grade, section) {
  await tx.academicClass.upsert({
    where: { grade_section_branchId_academicYear: { grade, section, branchId, academicYear: TARGET_YEAR } },
    update: { label: `${labelForGrade(grade)}-${section}` },
    create: {
      grade,
      section,
      label: `${labelForGrade(grade)}-${section}`,
      branchId,
      academicYear: TARGET_YEAR,
      studentCount: 0,
    },
  })
}

async function deleteZeroStudentClassesForYear(tx, branchId, academicYear) {
  const classes = await tx.academicClass.findMany({
    where: { branchId, academicYear },
    select: { id: true, _count: { select: { students: true } } },
  })
  const zeroIds = classes.filter((c) => c._count.students === 0).map((c) => c.id)
  if (!zeroIds.length) return 0

  const kits = await tx.bookKit.findMany({ where: { classId: { in: zeroIds } }, select: { id: true } })
  const kitIds = kits.map((k) => k.id)
  const items = await tx.bookKitItem.findMany({ where: { kitId: { in: kitIds } }, select: { id: true } })
  const itemIds = items.map((i) => i.id)

  if (itemIds.length) await tx.bookStock.deleteMany({ where: { itemId: { in: itemIds } } })
  if (kitIds.length) await tx.bookKitItem.deleteMany({ where: { kitId: { in: kitIds } } })
  if (kitIds.length) await tx.bookKit.deleteMany({ where: { id: { in: kitIds } } })
  await tx.academicClass.deleteMany({ where: { id: { in: zeroIds } } })

  return zeroIds.length
}

function inferSectionFromNeighbors(rows, idx, sectionFieldCandidates) {
  const getSectionAt = (i) => {
    const s = normalizeSection(pickField(rows[i], sectionFieldCandidates))
    return s && s !== 'NULL' ? s : ''
  }

  let up = idx - 1
  while (up >= 0) {
    const s = getSectionAt(up)
    if (s) { up = { i: up, s }; break }
    up -= 1
  }

  let down = idx + 1
  while (down < rows.length) {
    const s = getSectionAt(down)
    if (s) { down = { i: down, s }; break }
    down += 1
  }

  const upS = typeof up === 'object' ? up.s : ''
  const downS = typeof down === 'object' ? down.s : ''
  if (upS && downS && upS === downS) return { section: upS, reason: 'neighbors agree' }
  if (upS) return { section: upS, reason: downS ? 'neighbors differ, used above' : 'used above' }
  if (downS) return { section: downS, reason: 'used below' }
  return { section: '', reason: 'no neighbors with section found' }
}

async function main() {
  console.log('Narsingi promotion+seed started.')

  const branch = await prisma.branch.findFirst({ where: { code: BRANCH_CODE } })
  if (!branch) throw new Error(`Branch not found for code ${BRANCH_CODE}`)

  const wb1 = XLSX.readFile(FILE_1, { cellDates: false })
  const wb2 = XLSX.readFile(FILE_2, { cellDates: false })

  // Expected sheets in file1 (source 2025-26 classes)
  const file1Sheets = wb1.SheetNames
  if (!file1Sheets.length) throw new Error('File1 has no sheets')

  const report = {
    insertedByKey: new Map(), // `${grade}:${section}` -> count
    nullParent: [],
    nullPhone: [],
    nullParentAndPhone: [],
    nonTenDigitPhones: [],
    inferredSections: [],
    duplicatesSkipped: [],
    rollConflicts: [],
  }

  const students = []
  const seenDuplicates = new Set()

  // ---- File 1 (multi-sheet) ----
  for (const sheetName of file1Sheets) {
    const oldClassName = sheetName.trim()
    const rows = readSheetRows(wb1, sheetName)

    // Promotion is determined by sheet name (Rule 10: Nursery spelling in class column ignored)
    const promotedGrade = promotedGradeFromOld(oldClassName)

    const nameFields = ['Student Name', 'Student Name ', 'NAME', 'Name']
    const fatherFields = ['Father Name', 'Father Name ', 'FATHER NAME', 'FatherName']
    const phoneFields = ['Contact Number', 'Contact No', 'Contact', 'Ph No.', 'PH NO.', 'Phone', 'Mobile']
    const sectionFields = ['Section', 'Sec', 'SECTION']
    const rollFields = [
      'S.No',
      'S. No',
      'S No',
      'S  No',
      'S   No',
      'S    No',
      'Sl No',
      'SL NO',
      'SNO',
      'Serial No',
      'SERIAL NO',
      'Roll No',
      'ROLL NO',
    ]

    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx]

      const name = String(pickField(row, nameFields) ?? '').trim()
      const fatherNameRaw = pickField(row, fatherFields)
      const phoneRaw = pickField(row, phoneFields)
      const sectionRaw = pickField(row, sectionFields)
      const rollRaw = pickField(row, rollFields)

      const allBlank =
        isBlank(name) &&
        isBlank(fatherNameRaw) &&
        isBlank(phoneRaw) &&
        isBlank(sectionRaw) &&
        isBlank(rollRaw)

      if (allBlank) continue // Rule 1

      // If this looks like a header row in-data, skip (safety)
      if (name.toUpperCase() === 'NAME') continue

      let section = normalizeSection(sectionRaw)
      let inferred = null

      if (name && !section) {
        // Rule 2 (only explicitly described for 2 students in LKG sheet; safe to apply only in that sheet)
        if (oldClassName.trim().toUpperCase() === 'LKG') {
          const inf = inferSectionFromNeighbors(rows, idx, sectionFields)
          section = inf.section
          inferred = inf
        }
      }

      if (!name) {
        // A row with section/roll but no name should be ignored (padding / artifacts)
        continue
      }
      if (!section) {
        throw new Error(`Missing section for "${name}" in sheet "${sheetName}" (row index ${idx + 1}).`)
      }

      const { value: phoneDigits, isTenDigits } = normalizePhoneDigits(phoneRaw)
      const guardianName = isBlank(fatherNameRaw) ? null : String(fatherNameRaw).trim() || null

      // Roll number: schema requires non-null. Use S.No when present; otherwise create deterministic placeholder.
      const rollNumber =
        isBlank(rollRaw)
          ? `${branch.code}-${promotedGrade}-${section}-MISSING-${sheetName}-${idx + 1}`
          : String(Math.trunc(Number(rollRaw))).trim()

      const dupKey = `${promotedGrade}|${section}|${name}|${guardianName ?? ''}|${phoneDigits ?? ''}`
      if (seenDuplicates.has(dupKey)) {
        report.duplicatesSkipped.push({ name, promotedGrade, section, sheet: sheetName })
        continue
      }
      seenDuplicates.add(dupKey)

      if (inferred) {
        report.inferredSections.push({
          name,
          sheet: sheetName,
          promotedGrade,
          inferredSection: section,
          reason: inferred.reason,
          rowIndex: idx + 1,
        })
      }

      if (!guardianName) report.nullParent.push({ name, grade: promotedGrade, section, sheet: sheetName })
      if (!phoneDigits) report.nullPhone.push({ name, grade: promotedGrade, section, sheet: sheetName })
      if (!guardianName && !phoneDigits) report.nullParentAndPhone.push({ name, grade: promotedGrade, section, sheet: sheetName })
      if (phoneDigits && !isTenDigits) {
        report.nonTenDigitPhones.push({ name, grade: promotedGrade, section, phone: phoneDigits, sheet: sheetName })
      }

      students.push({
        name,
        promotedGrade,
        section,
        rollNumber,
        guardianName,
        guardianPhone: phoneDigits,
        initials: toInitials(name),
      })
    }
  }

  // ---- File 2 (8th & 9th -> 9th & 10th; no sections, assign A) ----
  const sheet2 = wb2.SheetNames[0]
  const rows2 = readSheetRows(wb2, sheet2)
  for (let idx = 0; idx < rows2.length; idx += 1) {
    const row = rows2[idx]
    const name = String(pickField(row, ['NAME', 'NAME ', 'Name', 'Student Name', 'Student Name ']) ?? '').trim()
    const fatherNameRaw = pickField(row, ['FATHER NAME', 'Father Name'])
    const phoneRaw = pickField(row, ['PH NO.', 'Ph No.', 'Phone', 'Contact No'])
    const classRaw = pickField(row, ['CLASS', 'Class'])

    const allBlank = isBlank(name) && isBlank(fatherNameRaw) && isBlank(phoneRaw) && isBlank(classRaw)
    if (allBlank) continue

    const classTxt = String(classRaw ?? '').trim().toUpperCase()
    // Rule 8/9: header artifact rows
    if (name.toUpperCase() === 'NAME' || classTxt === 'CLASS') continue

    if (!name) continue

    const section = 'A' // Rule 4
    const promotedGrade = promotedGradeFromOld(classTxt) // VIII->IX (9), IX->X (10)

    const { value: phoneDigits, isTenDigits } = normalizePhoneDigits(phoneRaw)
    const guardianName = isBlank(fatherNameRaw) ? null : String(fatherNameRaw).trim() || null

    // Roll number from S.No if present; else deterministic placeholder.
    const rollRaw = pickField(row, ['s no', 'S No', 'S.No', 'S. No', 'SL NO', 'Sl No', 'SNO', 'Serial No'])
    const rollNumber =
      isBlank(rollRaw)
        ? `${branch.code}-${promotedGrade}-${section}-MISSING-${sheet2}-${idx + 1}`
        : String(Math.trunc(Number(rollRaw))).trim()

    const dupKey = `${promotedGrade}|${section}|${name}|${guardianName ?? ''}|${phoneDigits ?? ''}`
    if (seenDuplicates.has(dupKey)) {
      report.duplicatesSkipped.push({ name, promotedGrade, section, sheet: sheet2 })
      continue
    }
    seenDuplicates.add(dupKey)

    if (!guardianName) report.nullParent.push({ name, grade: promotedGrade, section, sheet: sheet2 })
    if (!phoneDigits) report.nullPhone.push({ name, grade: promotedGrade, section, sheet: sheet2 })
    if (!guardianName && !phoneDigits) report.nullParentAndPhone.push({ name, grade: promotedGrade, section, sheet: sheet2 })
    if (phoneDigits && !isTenDigits) {
      report.nonTenDigitPhones.push({ name, grade: promotedGrade, section, phone: phoneDigits, sheet: sheet2 })
    }

    students.push({
      name,
      promotedGrade,
      section,
      rollNumber,
      guardianName,
      guardianPhone: phoneDigits,
      initials: toInitials(name),
    })
  }

  // Build required class pairs from actual students (prevents zero-student duplicate sections in UI)
  const requiredPairs = new Map() // `${grade}:${section}` -> true
  for (const s of students) requiredPairs.set(`${s.promotedGrade}:${s.section}`, true)

  console.log(`Parsed candidate students: ${students.length}`)

  // Insert flow (delete only Narsingi 2026-27)
  await prisma.$transaction(async (tx) => {
    const removedBefore = await deleteZeroStudentClassesForYear(tx, branch.id, TARGET_YEAR)
    if (removedBefore) console.log(`Removed ${removedBefore} zero-student duplicate sections before seeding.`)

    console.log('Ensuring AcademicClass rows exist for Narsingi (2026-27)...')
    for (const key of requiredPairs.keys()) {
      const [gradeStr, section] = key.split(':')
      await ensureClass(tx, branch.id, Number(gradeStr), section)
    }

    const classes = await tx.academicClass.findMany({
      where: { branchId: branch.id, academicYear: TARGET_YEAR },
      select: { id: true, grade: true, section: true },
    })
    const classIdByGradeSection = new Map()
    for (const c of classes) classIdByGradeSection.set(`${c.grade}:${c.section}`, c.id)

    console.log('Deleting existing Narsingi students for 2026-27...')
    await tx.students.deleteMany({ where: { class: { branchId: branch.id, academicYear: TARGET_YEAR } } })

    console.log('Inserting students...')
    // Ensure rollNumber uniqueness per classId (schema constraint @@unique([rollNumber, classId])).
    const rollSeenByClass = new Map() // classKey -> Map(rollNumber -> count)

    const toCreate = students.map((s) => {
      const classId = classIdByGradeSection.get(`${s.promotedGrade}:${s.section}`)
      if (!classId) throw new Error(`Missing AcademicClass for grade=${s.promotedGrade}, section=${s.section}`)

      const perClass = rollSeenByClass.get(classId) ?? new Map()
      const prev = perClass.get(s.rollNumber) ?? 0
      const next = prev + 1
      perClass.set(s.rollNumber, next)
      rollSeenByClass.set(classId, perClass)

      const rollNumber = next === 1 ? s.rollNumber : `${s.rollNumber}-R${next}`
      if (next > 1) {
        report.rollConflicts.push({
          name: s.name,
          grade: s.promotedGrade,
          section: s.section,
          originalRollNumber: s.rollNumber,
          adjustedRollNumber: rollNumber,
        })
      }

      return {
        classId,
        name: s.name,
        rollNumber,
        initials: s.initials,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        isActive: true,
      }
    })

    const created = await tx.students.createMany({ data: toCreate })
    console.log(`Inserted rows: ${created.count}`)

    console.log('Recomputing AcademicClass.studentCount for Narsingi 2026-27...')
    const counts = await tx.students.groupBy({
      by: ['classId'],
      where: { class: { branchId: branch.id, academicYear: TARGET_YEAR }, isActive: true },
      _count: { _all: true },
    })
    for (const c of counts) {
      await tx.academicClass.update({ where: { id: c.classId }, data: { studentCount: c._count._all } })
    }

    const removedAfter = await deleteZeroStudentClassesForYear(tx, branch.id, TARGET_YEAR)
    if (removedAfter) console.log(`Removed ${removedAfter} zero-student duplicate sections after seeding.`)
  })

  // Verification counts in DB
  const classesNow = await prisma.academicClass.findMany({
    where: { branchId: branch.id, academicYear: TARGET_YEAR },
    select: { grade: true, section: true, label: true, studentCount: true, _count: { select: { students: true } } },
    orderBy: [{ grade: 'asc' }, { section: 'asc' }],
  })

  const totalStudents = classesNow.reduce((s, c) => s + c._count.students, 0)
  console.log(`\n== Verification (DB) Narsingi ${TARGET_YEAR} ==`)
  console.log(`Total students: ${totalStudents}`)
  for (const c of classesNow) {
    console.log(`${c.label}\tgrade=${c.grade}\tsec=${c.section}\tcount=${c._count.students}`)
  }

  // Post-insertion report
  console.log(`\n== Post-insertion report ==`)
  console.log(`Null parent count: ${report.nullParent.length}`)
  console.log(`Null phone count: ${report.nullPhone.length}`)
  console.log(`Both null count: ${report.nullParentAndPhone.length}`)
  console.log(`Non-10-digit phones: ${report.nonTenDigitPhones.length}`)
  console.log(`Duplicates skipped: ${report.duplicatesSkipped.length}`)
  console.log(`Inferred sections: ${report.inferredSections.length}`)
  console.log(`Roll number conflicts adjusted: ${report.rollConflicts.length}`)

  if (report.inferredSections.length) {
    console.log('\nInferred sections:')
    for (const r of report.inferredSections) {
      console.log(`- ${r.name} -> grade=${r.promotedGrade} sec=${r.inferredSection} (sheet=${r.sheet}, row=${r.rowIndex}, ${r.reason})`)
    }
  }

  if (report.nonTenDigitPhones.length) {
    console.log('\nPhones not 10 digits (inserted as-is):')
    for (const r of report.nonTenDigitPhones) {
      console.log(`- ${r.name} grade=${r.grade} sec=${r.section} phone=${r.phone} (sheet=${r.sheet})`)
    }
  }

  if (report.duplicatesSkipped.length) {
    console.log('\nDuplicates skipped (same name+parent+phone within same promoted class/section):')
    for (const r of report.duplicatesSkipped) {
      console.log(`- ${r.name} grade=${r.promotedGrade} sec=${r.section} (sheet=${r.sheet})`)
    }
  }

  if (report.rollConflicts.length) {
    console.log('\nRoll conflicts adjusted to satisfy uniqueness:')
    for (const r of report.rollConflicts) {
      console.log(`- ${r.name} grade=${r.grade} sec=${r.section} roll="${r.originalRollNumber}" -> "${r.adjustedRollNumber}"`)
    }
  }

  // Lists requested (may be long; keep them as line items)
  console.log('\nStudents with null parent name:')
  for (const r of report.nullParent) console.log(`- ${r.name} grade=${r.grade} sec=${r.section} (sheet=${r.sheet})`)

  console.log('\nStudents with null contact number:')
  for (const r of report.nullPhone) console.log(`- ${r.name} grade=${r.grade} sec=${r.section} (sheet=${r.sheet})`)

  console.log('\nStudents with BOTH parent and contact null:')
  for (const r of report.nullParentAndPhone)
    console.log(`- ${r.name} grade=${r.grade} sec=${r.section} (sheet=${r.sheet})`)

  console.log('\nNarsingi promotion+seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

