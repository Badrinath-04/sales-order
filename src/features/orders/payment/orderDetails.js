/**
 * Builds payment summary line items from configure-step selection (UI totals only).
 */
export function buildOrderDetailsForPayment({ academic, uniform, totals }) {
  const bookKit = [{ label: 'Mandatory Workbooks (Core Subjects, Set of 6)', price: 120 }]
  if (academic.textbooks) {
    const opt =
      academic.textbookOption === 'All Subjects' ? 'All subjects' : academic.textbookOption
    bookKit.push({ label: `Textbooks (${opt})`, price: 85 })
  }
  if (academic.notebooks && academic.notebookOption !== 'None') {
    bookKit.push({ label: `Notebooks (${academic.notebookOption})`, price: 25 })
  }

  const uniformKit = []
  if (uniform.includeKit) {
    if (uniform.shirt) {
      uniformKit.push({ label: 'Oxford Shirt (Half Sleeve, M(38))', price: 45 })
    }
    if (uniform.trousers) {
      uniformKit.push({ label: `Cotton Trousers (${uniform.trousersWaist})`, price: 65 })
    }
    if (uniform.socks) {
      uniformKit.push({ label: `Logo Socks (${uniform.socksSize})`, price: 15 })
    }
  }

  const subtotal = totals.academicTotal + totals.uniformTotal
  const administrativeFee = 0

  return {
    bookKit,
    uniformKit,
    subtotal,
    administrativeFee,
    total: subtotal + administrativeFee,
  }
}
