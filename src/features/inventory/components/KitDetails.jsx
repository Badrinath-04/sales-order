import { useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { kitDetails } from '../data'

const inputReadOnlyClass =
  'w-full rounded-xl border-none bg-surface-container-low px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20'
const inputLockedClass = `${inputReadOnlyClass} cursor-not-allowed opacity-75`

export default function KitDetails({ selectedClassId }) {
  const resolved = kitDetails[selectedClassId] ?? kitDetails['06']
  const { role } = useAdminSession()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  const displayTitle = useMemo(() => {
    return kitDetails[selectedClassId]?.title ?? `Class ${Number(selectedClassId)} Kit Details`
  }, [selectedClassId])

  const [lines, setLines] = useState(() => resolved.lines)
  const [isEditing, setIsEditing] = useState(false)

  const fieldsEditable = isSuperAdmin && isEditing

  const handleUpdateStock = () => {
    if (!isSuperAdmin || !isEditing) return
    setIsEditing(false)
  }

  return (
    <div className="col-span-12 lg:col-span-5">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0px_12px_32px_rgba(27,28,28,0.06)]">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-8">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">{displayTitle}</h3>
            <p className="text-sm font-medium text-stone-500">{resolved.lastUpdated}</p>
          </div>
          <div className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase text-on-primary-fixed-variant">
            {resolved.badge}
          </div>
        </div>
        <div className="flex flex-1 flex-col space-y-6 p-8">
          {lines.map((line) => (
            <div key={line.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-stone-400" aria-hidden>
                  {line.icon}
                </span>
                <label className="text-sm font-bold text-stone-700" htmlFor={`${line.id}-stock`}>
                  {line.label}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Current Stock
                  </span>
                  <input
                    id={`${line.id}-stock`}
                    className={fieldsEditable ? inputReadOnlyClass : inputLockedClass}
                    type="number"
                    value={line.stock}
                    readOnly={!fieldsEditable}
                    disabled={!fieldsEditable}
                    aria-readonly={!fieldsEditable}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, stock: value } : l)),
                      )
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Unit Price ($)
                  </span>
                  <input
                    id={`${line.id}-price`}
                    className={fieldsEditable ? inputReadOnlyClass : inputLockedClass}
                    type="number"
                    step="0.01"
                    value={line.price}
                    readOnly={!fieldsEditable}
                    disabled={!fieldsEditable}
                    aria-readonly={!fieldsEditable}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, price: value } : l)),
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 bg-stone-50 p-8">
          <div className="flex w-full gap-3">
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                aria-pressed={isEditing}
                aria-label={isEditing ? 'Lock stock fields' : 'Edit stock'}
                title={isEditing ? 'Finish editing' : 'Edit stock'}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-white shadow-sm transition-colors hover:bg-surface-container-low ${
                  isEditing ? 'text-primary ring-2 ring-primary/30' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-2xl" data-icon="edit" aria-hidden>
                  edit
                </span>
              </button>
            ) : null}
            <button
              type="button"
              disabled={!isSuperAdmin || !isEditing}
              onClick={handleUpdateStock}
              className={`flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container font-bold text-white shadow-lg transition-all hover:shadow-primary/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none ${
                isSuperAdmin ? 'flex-1' : 'w-full'
              }`}
            >
              <span className="material-symbols-outlined" aria-hidden>
                inventory_2
              </span>
              Update Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
