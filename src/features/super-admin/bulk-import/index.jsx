import { useCallback, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { classLabelForGrade, isSupportedGrade } from '@/utils/classes'

// Standard column names we look for (case-insensitive partial match)
const COL_MAP = [
  { key: 'name',        aliases: ['student name', 'name', 'student'] },
  { key: 'rollNumber',  aliases: ['roll', 'serial', 's.no', 'sno', 'sl.no'] },
  { key: 'fatherName',  aliases: ['father name', "father's name", 'parent name', 'guardian'] },
  { key: 'contactNo',   aliases: ['contact', 'mobile', 'phone', 'contact no'] },
  { key: 'class',       aliases: ['class', 'grade'] },
  { key: 'section',     aliases: ['sec', 'section'] },
]

function detectColumn(header) {
  const h = String(header).toLowerCase().trim()
  for (const col of COL_MAP) {
    if (col.aliases.some((a) => h.includes(a))) return col.key
  }
  return null
}

function parseSheet(worksheet) {
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
  if (json.length < 2) return []

  // find header row (first row with ≥ 2 non-empty cells)
  let headerRowIdx = 0
  for (let i = 0; i < Math.min(5, json.length); i++) {
    const nonEmpty = json[i].filter(Boolean).length
    if (nonEmpty >= 2) { headerRowIdx = i; break }
  }

  const headers = json[headerRowIdx]
  const colMapping = {}
  headers.forEach((h, i) => {
    const key = detectColumn(h)
    if (key && !(key in colMapping)) colMapping[i] = key
  })

  return json.slice(headerRowIdx + 1).map((row) => {
    const obj = {}
    Object.entries(colMapping).forEach(([i, key]) => {
      obj[key] = String(row[i] ?? '').trim()
    })
    return obj
  }).filter((r) => r.name)
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['S.No', 'Student Name', 'Father Name', 'Contact No', 'Class', 'Section'],
    [1, 'Example Student', 'Father Name', '9999999999', '6', 'A'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'student_import_template.xlsx')
}

export default function BulkImport() {
  const fetchBranches = useCallback(() => branchesApi.list(), [])
  const { data: branchesData } = useApi(fetchBranches, null, [])
  const branches = (Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])).filter((b) => b.type !== 'MAIN')

  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const fetchClasses = useCallback(
    () => (selectedBranchId ? branchesApi.getClasses(selectedBranchId) : null),
    [selectedBranchId],
  )
  const { data: classesData } = useApi(fetchClasses, null, [selectedBranchId])
  const classes = (classesData ?? []).filter((c) => isSupportedGrade(c.grade))

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const parsed = parseSheet(ws)
        setRows(parsed)
      } catch {
        setError('Could not read file. Please upload a valid .xlsx or .csv file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (!selectedBranchId || !selectedClassId || rows.length === 0) return
    setImporting(true)
    setError('')
    setResult(null)
    try {
      const res = await branchesApi.bulkCreateStudents(selectedBranchId, {
        classId: selectedClassId,
        students: rows,
      })
      const data = res?.data?.data ?? res?.data
      setResult(data)
      setRows([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="headline text-3xl font-extrabold tracking-tight text-on-surface">Bulk Import Students</h1>
        <p className="mt-2 font-body text-on-surface-variant">
          Upload an Excel or CSV file to add students to a class. Download the template to get started.
        </p>
      </div>

      {/* Step 1 — Branch + Class */}
      <div className="mb-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-lg font-bold">Step 1 — Select Branch & Class</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Branch
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setSelectedClassId('') }}
              className="w-full rounded-xl border border-outline-variant/30 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select branch —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={!selectedBranchId}
              className="w-full rounded-xl border border-outline-variant/30 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              <option value="">— Select class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{classLabelForGrade(c.grade)} — Section {c.section}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2 — Upload */}
      <div className="mb-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold">Step 2 — Upload File</h2>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>download</span>
            Download Template
          </button>
        </div>
        <div className="rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant" aria-hidden>upload_file</span>
          <p className="mb-4 text-sm text-on-surface-variant">
            Accepts <strong>.xlsx</strong> or <strong>.csv</strong>. Columns detected automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={handleFile}
            className="hidden"
            id="bulk-file"
          />
          <label
            htmlFor="bulk-file"
            className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
          >
            Choose File
          </label>
          {fileName && (
            <p className="mt-3 text-sm font-medium text-primary">{fileName} — {rows.length} students detected</p>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold">
              Step 3 — Preview ({rows.length} students)
              {selectedClass && (
                <span className="ml-3 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {classLabelForGrade(selectedClass.grade)} – {selectedClass.section}
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['#', 'Name', 'Roll No', 'Father Name', 'Contact', 'Class', 'Section'].map((h) => (
                    <th key={h} className="px-4 py-3 font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest">
                {rows.map((r, i) => (
                  <tr key={i} className={!r.name ? 'bg-error-container/20' : ''}>
                    <td className="px-4 py-2 text-on-surface-variant">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{r.name || <span className="text-error">Missing</span>}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.rollNumber || '—'}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.fatherName || '—'}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.contactNo || '—'}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.class || '—'}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{r.section || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !selectedClassId || !selectedBranchId}
              className="rounded-xl bg-primary px-8 py-3 font-body text-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 disabled:opacity-50"
            >
              {importing ? 'Importing…' : `Import ${rows.length} Students`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-4 font-headline text-lg font-bold">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">{result.successCount}</p>
              <p className="text-xs font-medium text-on-surface-variant">Imported</p>
            </div>
            <div className="rounded-xl bg-error-container/20 p-4 text-center">
              <p className="text-2xl font-extrabold text-error">{result.errorCount}</p>
              <p className="text-xs font-medium text-on-surface-variant">Errors</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4 text-center">
              <p className="text-2xl font-extrabold text-on-surface">{result.successCount + result.errorCount}</p>
              <p className="text-xs font-medium text-on-surface-variant">Total Rows</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-label text-xs font-semibold uppercase tracking-wider text-error">Row Errors</p>
              <ul className="space-y-1">
                {result.errors.map((e) => (
                  <li key={e.row} className="text-sm text-error">Row {e.row}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
