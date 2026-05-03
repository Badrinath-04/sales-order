import { useMemo, useState } from 'react'
import { branchesApi, inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'

const ICONS = [
  { value: 'apparel', label: 'Uniform' },
  { value: 'checkroom', label: 'Shirt' },
  { value: 'styler', label: 'Pant' },
  { value: 'socks', label: 'Socks' },
  { value: 'category', label: 'Other' },
]

function newSize() {
  return { id: Date.now() + Math.random(), label: '', price: '', openingStocks: {} }
}

export default function CreateUniformProductPanel({ existingCategory, onClose, onSaved }) {
  const isEdit = Boolean(existingCategory?.id)
  const fetchBranches = () => branchesApi.list()
  const { data: branchesData } = useApi(fetchBranches, null, [])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list
  }, [branchesData])

  const [form, setForm] = useState({
    label: existingCategory?.label ?? '',
    icon: existingCategory?.icon ?? 'apparel',
  })
  const [sizes, setSizes] = useState(
    existingCategory?.sizes?.length
      ? existingCategory.sizes.map((s) => ({ id: s.id, label: s.name, price: String(s.price), openingStocks: {} }))
      : [newSize()],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }))
  const setSize = (id, field, value) => setSizes((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  const setSizeBranchStock = (id, branchId, value) => {
    setSizes((prev) => prev.map((s) => (
      s.id === id ? { ...s, openingStocks: { ...(s.openingStocks ?? {}), [branchId]: value } } : s
    )))
  }
  const addSize = () => setSizes((prev) => [newSize(), ...prev])
  const removeSize = (id) => setSizes((prev) => prev.filter((s) => s.id !== id))

  async function handleSave() {
    setError('')
    if (!form.label.trim()) { setError('Product name is required.'); return }
    const payloadSizes = sizes
      .filter((s) => s.label.trim())
      .map((s, idx) => {
        const openingStocks = {}
        for (const b of branches) {
          const raw = s.openingStocks?.[b.id]
          openingStocks[b.id] = raw === '' || raw == null ? 0 : Math.max(0, parseInt(raw, 10) || 0)
        }
        return {
          ...(typeof s.id === 'string' ? { id: s.id } : {}),
          label: s.label.trim(),
          code: s.label.trim(),
          price: parseFloat(s.price) || 0,
          position: idx,
          openingStocks,
        }
      })
    if (!payloadSizes.length) { setError('Add at least one size variant.'); return }

    setSaving(true)
    try {
      if (isEdit) {
        await inventoryApi.updateUniformProduct(existingCategory.id, {
          label: form.label.trim(),
          icon: form.icon,
          sizes: payloadSizes,
        })
      } else {
        await inventoryApi.createUniformProduct({
          label: form.label.trim(),
          icon: form.icon,
          sizes: payloadSizes,
        })
      }
      onSaved?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save uniform product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 p-6">
          <div>
            <h2 className="font-headline text-xl font-bold">{isEdit ? 'Edit Uniform Product' : 'Add Uniform Product'}</h2>
            <p className="text-sm text-on-surface-variant">Product type is fixed as Variant (sizes)</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-6">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Product Name *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setField('label', e.target.value)}
              placeholder="e.g. Shirt, Pant, Socks"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.value}
                  type="button"
                  onClick={() => setField('icon', ic.value)}
                  title={ic.label}
                  aria-label={ic.label}
                  className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 gap-0.5 ${
                    form.icon === ic.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base leading-none">{ic.value}</span>
                  <span className="w-full truncate text-center text-[9px] leading-tight font-medium px-1">{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/20 p-3">
            <p className="text-xs font-semibold text-on-surface">Product Type: Variant</p>
            <p className="text-[11px] text-on-surface-variant">Each size is managed as a variant row.</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Size Variants</label>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Size
              </button>
            </div>
            <div className="space-y-2">
              {sizes.map((s, idx) => (
                <div key={s.id} className="space-y-2 rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 flex-shrink-0 text-right text-xs font-bold text-stone-300">{idx + 1}</span>
                    <input
                      type="text"
                      value={s.label}
                      onChange={(e) => setSize(s.id, 'label', e.target.value)}
                      placeholder="Size label (e.g. S, M, L, XL, 30)"
                      className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      style={{ fontSize: 'max(16px, 0.875rem)' }}
                    />
                    <input
                      type="number"
                      value={s.price}
                      min="0"
                      step="0.01"
                      onChange={(e) => setSize(s.id, 'price', e.target.value)}
                      placeholder="₹"
                      className="w-20 flex-shrink-0 rounded-xl border border-outline-variant/30 bg-white px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-28 md:px-3"
                      style={{ fontSize: 'max(16px, 0.875rem)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(s.id)}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-error/10 hover:text-error"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-7">
                    {branches.map((b) => (
                      <input
                        key={`${s.id}-${b.id}`}
                        type="number"
                        min="0"
                        value={s.openingStocks?.[b.id] ?? ''}
                        onChange={(e) => setSizeBranchStock(s.id, b.id, e.target.value)}
                        placeholder={`${b.name}: opening`}
                        className="rounded-lg border border-outline-variant/30 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl bg-error/10 px-4 py-2 text-sm font-medium text-error">{error}</p>}
        </div>

        <div className="border-t border-stone-100 p-6">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
