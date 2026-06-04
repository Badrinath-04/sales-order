/** Minimal print styles inlined for mobile Chrome / WebView (parent page CSS does not apply). */
const ROSTER_PRINT_CSS = `
  @page { margin: 12mm; size: auto; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .student-roster-print-report { width: 100%; }
  .student-roster-print-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #000;
  }
  .student-roster-print-header h1 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 800;
  }
  .student-roster-print-header p {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
  }
  .student-roster-print-meta-grid {
    display: grid;
    grid-template-columns: auto auto;
    gap: 3px 12px;
    margin: 0;
    min-width: 240px;
  }
  .student-roster-print-meta-grid dt,
  .student-roster-print-meta-grid dd {
    margin: 0;
  }
  .student-roster-print-meta-grid dt { font-weight: 700; }
  .student-roster-print-meta-grid dd { text-align: right; }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #888;
    padding: 5px 6px;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  th { background: #e8e8e8; font-weight: 800; }
  tbody tr:nth-child(even) td { background: #f3f3f3; }
  th:nth-child(1), td:nth-child(1) { width: 34px; text-align: center; }
  th:nth-child(2) { width: 18%; }
  th:nth-child(3) { width: 17%; }
  th:nth-child(4) { width: 13%; }
  th:nth-child(5) { width: 11%; }
  th:nth-child(6) { width: 12%; }
  .student-roster-print-footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #999;
    font-size: 9px;
    color: #444;
    text-align: center;
  }
`

export function shouldUseDedicatedPrintWindow() {
  if (typeof window === 'undefined') return false
  const narrow = window.matchMedia('(max-width: 1024px)').matches
  const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
  return narrow || touch || mobileUa
}

function buildPrintDocumentHtml(title, bodyHtml) {
  const safeTitle = String(title || 'Student Roster').replace(/</g, '')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>${ROSTER_PRINT_CSS}</style>
</head>
<body>
  <div class="student-roster-print-area">${bodyHtml}</div>
</body>
</html>`
}

/**
 * Prints via a hidden iframe (no popup blocker) — reliable on Chrome mobile/tablet
 * where in-page @media print often yields a blank preview.
 */
export function printStudentRosterInNewWindow({ title, contentHtml }) {
  const html = contentHtml?.trim()
  if (!html) {
    window.print()
    return false
  }

  const docHtml = buildPrintDocumentHtml(title, html)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', String(title || 'Student Roster'))
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = frameWindow?.document
  if (!frameWindow || !frameDoc) {
    iframe.remove()
    window.print()
    return false
  }

  frameDoc.open()
  frameDoc.write(docHtml)
  frameDoc.close()

  const cleanup = () => {
    iframe.remove()
  }

  const runPrint = () => {
    try {
      frameWindow.focus()
      frameWindow.print()
    } catch {
      window.print()
    }
    window.setTimeout(cleanup, 2500)
  }

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(runPrint, 300)
  } else {
    iframe.addEventListener('load', () => window.setTimeout(runPrint, 300), { once: true })
  }

  return true
}
