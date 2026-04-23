import { useState } from 'react'

function formatStockLabel(stock) {
  return `${stock.toLocaleString()} Units`
}

export default function SizeInventory({ categoryLabel, rows, canManageStock }) {
  const [localRows, setLocalRows] = useState(() => rows.map((r) => ({ ...r })))
  const [editingRowId, setEditingRowId] = useState(null)
  const [draftStock, setDraftStock] = useState('')

  function beginEdit(row) {
    if (!canManageStock) return
    setEditingRowId(row.id)
    setDraftStock(String(row.stock))
  }

  function saveRow(rowId) {
    const parsed = draftStock === '' ? NaN : Number(draftStock)
    if (Number.isNaN(parsed) || parsed < 0) {
      setEditingRowId(null)
      setDraftStock('')
      return
    }
    const next = Math.floor(parsed)
    setLocalRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              stock: next,
              stockLabel: formatStockLabel(next),
              tone: next < 20 ? 'low' : 'normal',
              alertLabel: next < 20 ? 'Low Stock Alert' : undefined,
            }
          : r,
      ),
    )
    setEditingRowId(null)
    setDraftStock('')
  }

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h3 className="font-headline text-xl font-bold">Size Inventory: {categoryLabel}</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="rounded-full bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
          >
            History
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-outline">
          <div>Size Variant</div>
          <div className="text-center">Available Stock</div>
          <div className="text-center">Price (Unit)</div>
          <div className="text-right">Quick Action</div>
        </div>
        {localRows.map((row) => {
          const isLow = row.tone === 'low'
          const rowSurface = isLow
            ? 'grid grid-cols-4 items-center rounded-2xl bg-surface-container-low px-6 py-5 ring-1 ring-error/20 transition-all group hover:bg-surface-container hover:shadow-md'
            : 'grid grid-cols-4 items-center rounded-2xl bg-surface-container-low px-6 py-5 transition-all group hover:bg-surface-container hover:shadow-md'
          const codeClass = isLow
            ? 'flex h-10 w-10 items-center justify-center rounded-lg bg-white text-error shadow-sm font-bold'
            : 'flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-primary shadow-sm'
          const stockClass = isLow
            ? 'text-center font-extrabold text-error'
            : 'text-center font-bold text-on-surface-variant'
          const isRowEditing = editingRowId === row.id && canManageStock

          return (
            <div key={row.id} className={rowSurface}>
              <div className="flex items-center gap-3">
                <div className={codeClass}>{row.code}</div>
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">{row.name}</span>
                  {row.alertLabel ? (
                    <span className="text-[10px] font-bold uppercase tracking-tight text-error">
                      {row.alertLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={stockClass}>
                {isRowEditing ? (
                  <input
                    type="number"
                    min={0}
                    className="mx-auto w-28 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-2 py-1.5 text-center text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/30"
                    value={draftStock}
                    onChange={(e) => setDraftStock(e.target.value)}
                    aria-label={`Edit stock for size ${row.code}`}
                  />
                ) : (
                  row.stockLabel
                )}
              </div>
              <div className="text-center">
                <span className="rounded-full bg-primary/5 px-3 py-1 text-sm font-bold text-primary">
                  {row.priceLabel}
                </span>
              </div>
              <div className="text-right">
                {row.action.type === 'add' || row.action.type === 'restock' ? (
                  <button
                    type="button"
                    disabled={!canManageStock}
                    onClick={() => {
                      if (isRowEditing) {
                        saveRow(row.id)
                      } else {
                        beginEdit(row)
                      }
                    }}
                    title={!canManageStock ? 'Only super admins can update uniform stock' : undefined}
                    className={
                      row.action.type === 'add'
                        ? 'ml-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
                        : 'ml-auto flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:bg-error/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>
                      {isRowEditing ? 'check' : row.action.icon}
                    </span>
                    {isRowEditing ? 'Save' : row.action.label}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canManageStock}
                    className="ml-auto flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:bg-error/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>
                      {row.action.icon}
                    </span>
                    {row.action.label}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
