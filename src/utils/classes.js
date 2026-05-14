export const SCHOOL_CLASSES = [
  { grade: -2, label: 'Nursery', shortLabel: 'NUR' },
  { grade: -1, label: 'LKG', shortLabel: 'LKG' },
  { grade: 0, label: 'UKG', shortLabel: 'UKG' },
  ...Array.from({ length: 10 }, (_, idx) => {
    const grade = idx + 1
    return { grade, label: `Class ${grade}`, shortLabel: String(grade) }
  }),
]

export const SCHOOL_GRADE_MIN = -2
export const SCHOOL_GRADE_MAX = 10

export function isSupportedGrade(grade) {
  const value = Number(grade)
  return Number.isInteger(value) && value >= SCHOOL_GRADE_MIN && value <= SCHOOL_GRADE_MAX
}

export function classLabelForGrade(grade) {
  const value = Number(grade)
  return SCHOOL_CLASSES.find((item) => item.grade === value)?.label ?? `Class ${grade}`
}

export function shortClassLabelForGrade(grade) {
  const value = Number(grade)
  return SCHOOL_CLASSES.find((item) => item.grade === value)?.shortLabel ?? String(grade)
}
