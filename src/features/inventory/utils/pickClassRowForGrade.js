/**
 * Same class row selection as BooksView when a single branch is selected:
 * prefer section A, otherwise first section for that grade.
 */
export function pickClassRowForGrade(classList, grade) {
  const g = Number(grade)
  if (Number.isNaN(g) || !classList?.length) return null
  return (
    classList.find((c) => Number(c.grade) === g && c.section === 'A') ??
    classList.find((c) => Number(c.grade) === g) ??
    null
  )
}
