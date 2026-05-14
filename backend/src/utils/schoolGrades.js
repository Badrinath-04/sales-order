/** Nursery (-2) through Class 10 — aligned with frontend `src/utils/classes.js`. */
const MIN_GRADE = -2
const MAX_GRADE = 10

const LABELS = new Map([
  [-2, 'Nursery'],
  [-1, 'LKG'],
  [0, 'UKG'],
  ...Array.from({ length: 10 }, (_, i) => [i + 1, `Class ${i + 1}`]),
])

function classLabelForGrade(grade) {
  const g = Number(grade)
  return LABELS.get(g) ?? `Class ${grade}`
}

module.exports = { MIN_GRADE, MAX_GRADE, classLabelForGrade }
