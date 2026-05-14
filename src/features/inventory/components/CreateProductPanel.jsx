import { useMemo, useState } from 'react'
import { inventoryApi, branchesApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { classLabelForGrade } from '@/utils/classes'

const PRODUCT_TYPES = [
  { value: 'BUNDLE', label: 'Bundle', desc: 'Full bundle price + optional sub-items' },
  { value: 'VARIANT', label: 'Variant', desc: 'One product with multiple variants' },
]

const ICONS = [
  { value: 'menu_book', label: 'Textbook' },
  { value: 'book', label: 'Book' },
  { value: 'auto_stories', label: 'Notebook' },
  { value: 'edit_note', label: 'Workbook' },
  { value: 'science', label: 'Science' },
  { value: 'calculate', label: 'Maths' },
  { value: 'language', label: 'Language' },
  { value: 'palette', label: 'Art' },
  { value: 'category', label: 'Other' },
]

function newSubItem() {
  return { id: Date.now() + Math.random(), label: '', price: '', openingStockByBranch: {} }
}

export default function CreateProductPanel({
  classGrade,
  kitClassLabel,
  existingItem,
  canArchiveProducts = false,
  canEditProductDetails = true,
  onClose,
  onSaved,
  panelTabs,
}) {
  const isEdit = Boolean(existingItem)
  const fetchBranches = () => branchesApi.list()
  const { data: branchesData } = useApi(fetchBranches, null, [])
  const branches = useMemo(() => {
    const list = Array.isArray(branchesData) ? branchesData : (branchesData?.data ?? [])
    return list
  }, [branchesData])

  const [form, setForm] = useState(() => ({
    label: existingItem?.label ?? '',
    icon: existingItem?.icon ?? 'menu_book',
    productType: existingItem?.productType === 'VARIANT' ? 'VARIANT' : 'BUNDLE',
    bundlePrice: existingItem?.setPrice != null ? String(existingItem.setPrice) : '',
  }))

  const [subItems, setSubItems] = useState(() =>
    existingItem?.subItems?.length
      ? existingItem.subItems.map((s) => ({ id: s.id, label: s.label, price: String(s.price), openingStockByBranch: {} }))
      : [],
  )

  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState('')
  const [openingStocksByBranch, setOpeningStocksByBranch] = useState({})
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  function addSubItem() { setSubItems((p) => [newSubItem(), ...p]) }
  function removeSubItem(id) { setSubItems((p) => p.filter((s) => s.id !== id)) }
  function updateSubItem(id, field, value) {
    setSubItems((p) => p.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }
  function updateSubItemBranchStock(id, branchId, value) {
    setSubItems((p) => p.map((s) => (s.id === id
      ? { ...s, openingStockByBranch: { ...(s.openingStockByBranch ?? {}), [branchId]: value } }
      : s)))
  }

  async function handleSave() {
    if (isEdit && !canEditProductDetails) return

    setError('')
    if (!form.label.trim()) { setError('Product name is required.'); return }
    if (form.productType === 'BUNDLE') {
      if (!form.bundlePrice || isNaN(parseFloat(form.bundlePrice))) {
        setError('Bundle price is required.')
        return
      }
    } else if (form.productType === 'VARIANT' && subItems.filter((s) => s.label.trim()).length === 0) {
      setError('Add at least one variant with name and price.')
      return
    }

    const productLabel = form.label.trim()
    const openingStocks = {}
    for (const branch of branches) {
      const raw = openingStocksByBranch[branch.id]
      openingStocks[branch.id] = raw === '' || raw == null ? 0 : Math.max(0, parseInt(raw, 10) || 0)
    }

    const payload = {
      label: productLabel,
      icon: form.icon,
      productType: form.productType,
      classGrade: Number(classGrade),
      price: 0,
      setPrice: form.productType === 'BUNDLE' ? Number(form.bundlePrice) : null,
      subItems: subItems
        .filter((s) => s.label.trim())
        .map((s, i) => ({
          label: s.label.trim(),
          price: parseFloat(s.price) || 0,
          position: i,
        })),
      openingStocks,
    }

    if (form.productType === 'VARIANT') {
      const firstVariant = subItems.find((s) => s.label.trim())
      payload.price = Number(firstVariant?.price || 0)
    } else {
      const firstSubItem = subItems.find((s) => s.label.trim())
      payload.price = Number(firstSubItem?.price || 0)
    }

    setSaving(true)
    try {
      if (isEdit) {
        await inventoryApi.updateProduct(existingItem.id, payload)
      } else {
        // For variants, create one product row per variant with per-branch opening stocks.
        if (form.productType === 'VARIANT') {
          const variantGroupKey =
            (typeof crypto !== 'undefined' && crypto.randomUUID)
              ? crypto.randomUUID()
              : `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`
          const variants = subItems.filter((s) => s.label.trim())
          for (const variant of variants) {
            const variantOpeningStocks = {}
            for (const branch of branches) {
              const value = variant.openingStockByBranch?.[branch.id]
              variantOpeningStocks[branch.id] = value === '' || value == null ? 0 : Math.max(0, parseInt(value, 10) || 0)
            }
            await inventoryApi.createProduct({
              classGrade: Number(classGrade),
              label: `${productLabel} - ${variant.label.trim()}`,
              icon: form.icon,
              productType: 'VARIANT',
              price: parseFloat(variant.price) || 0,
              setPrice: null,
              subItems: [],
              position: 0,
              openingStocks: variantOpeningStocks,
              catalogKey: variantGroupKey,
            })
          }
        } else {
          await inventoryApi.createProduct({
            ...payload,
            position: 0,
            openingStocks,
          })
        }
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  async function performArchiveToggle() {
    const isArchived = Boolean(existingItem?.isArchived)
    setArchiving(true)
    try {
      if (isArchived) {
        await inventoryApi.restoreProduct(existingItem.id)
      } else {
        await inventoryApi.archiveProduct(existingItem.id)
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${isArchived ? 'restore' : 'archive'} product.`)
    } finally {
      setArchiving(false)
      setShowArchiveConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-6">
          <div>
            <h2 className="font-headline text-xl font-bold">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </h2>
            {(kitClassLabel || classGrade !== undefined) && (
              <p className="text-sm text-on-surface-variant">{kitClassLabel ?? classLabelForGrade(classGrade)}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {panelTabs && (
          <div className="flex gap-2 border-b border-stone-100 px-6 py-3">
            {panelTabs.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => panelTabs.onTabChange?.(tab.id)}
                disabled={tab.disabled}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  panelTabs.activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Product Name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Product Name *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="e.g. Textbooks, Workbooks, Notebooks"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.value}
                  type="button"
                  title={ic.label}
                  onClick={() => set('icon', ic.value)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${
                    form.icon === ic.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>{ic.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Product Type</label>
            <div className="flex gap-2">
              {PRODUCT_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => set('productType', pt.value)}
                  className={`flex flex-1 flex-col gap-0.5 rounded-xl border-2 p-3 text-left transition-colors ${
                    form.productType === pt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/20 hover:border-primary/30'
                  }`}
                >
                  <span className="text-xs font-bold text-on-surface">{pt.label}</span>
                  <span className="text-[10px] text-on-surface-variant">{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {form.productType === 'BUNDLE' && (
            <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-stone-400">Bundle Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.bundlePrice}
                  onChange={(e) => set('bundlePrice', e.target.value)}
                  placeholder="e.g. 1299.00"
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Opening Stock Per Branch
              </label>
              <div className="grid grid-cols-3 gap-2">
                {branches.map((branch) => (
                  <input
                    key={branch.id}
                    type="number"
                    min="0"
                    value={openingStocksByBranch[branch.id] ?? ''}
                    onChange={(e) => setOpeningStocksByBranch((prev) => ({ ...prev, [branch.id]: e.target.value }))}
                    placeholder={`${branch.name}`}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sub-items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {form.productType === 'BUNDLE' ? 'Bundle Sub-items' : 'Variants'}
                <span className="ml-1 normal-case font-normal text-stone-300">
                  {form.productType === 'BUNDLE'
                    ? '(e.g. Maths, Science, English)'
                    : '(e.g. 100 pages, 200 pages)'}
                </span>
              </label>
              <button
                type="button"
                onClick={addSubItem}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden>add</span>
                Add
              </button>
            </div>

            {subItems.length === 0 && (
              <p className="rounded-xl bg-surface-container-low p-4 text-center text-xs text-on-surface-variant">
                No rows yet. Click "Add" to define {form.productType === 'BUNDLE' ? 'bundle sub-items' : 'variants'}.
              </p>
            )}

            <div className="space-y-2">
              {subItems.map((s, idx) => (
                <div key={s.id} className="space-y-2 rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
                  <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-300 w-5 text-right">{idx + 1}</span>
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateSubItem(s.id, 'label', e.target.value)}
                    placeholder="e.g. Maths, Science, Telugu…"
                    className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{ fontSize: 'max(16px, 0.875rem)' }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={s.price}
                    onChange={(e) => updateSubItem(s.id, 'price', e.target.value)}
                    placeholder="₹"
                    className="w-20 flex-shrink-0 rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-right placeholder:text-on-surface-variant/90 focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-28"
                    style={{ fontSize: 'max(16px, 0.875rem)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubItem(s.id)}
                    className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-lg text-stone-400 hover:bg-error/10 hover:text-error transition-colors"
                    aria-label="Remove sub-item"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden>delete</span>
                  </button>
                </div>
                {!isEdit && form.productType === 'VARIANT' && (
                  <div className="grid grid-cols-3 gap-2 pl-7">
                    {branches.map((branch) => (
                      <input
                        key={`${s.id}-${branch.id}`}
                        type="number"
                        min="0"
                        value={s.openingStockByBranch?.[branch.id] ?? ''}
                        onChange={(e) => updateSubItemBranchStock(s.id, branch.id, e.target.value)}
                        placeholder={`${branch.name}: stock`}
                        className="rounded-lg border border-outline-variant/30 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ))}
                  </div>
                )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error/10 px-4 py-2 text-sm font-medium text-error">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 p-6">
          {isEdit && canArchiveProducts && (
            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              disabled={archiving}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 py-2.5 text-sm font-semibold text-error hover:bg-error/5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base" aria-hidden>{existingItem?.isArchived ? 'unarchive' : 'archive'}</span>
              {archiving ? (existingItem?.isArchived ? 'Restoring…' : 'Archiving…') : (existingItem?.isArchived ? 'Restore Product' : 'Archive Product')}
            </button>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (isEdit && !canEditProductDetails)}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? (canEditProductDetails ? 'Save Changes' : 'No edit permission') : 'Add Product'}
            </button>
          </div>
        </div>
      </div>

      {showArchiveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-headline text-lg font-bold text-on-surface">
              {existingItem?.isArchived ? 'Restore Product?' : 'Archive Product?'}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              {existingItem?.isArchived
                ? 'This product will become visible in class kits again.'
                : 'This product will be hidden from active views. Historical records stay preserved.'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={archiving}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold hover:bg-surface-container-low disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performArchiveToggle}
                disabled={archiving}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                  existingItem?.isArchived ? 'bg-primary hover:bg-primary/90' : 'bg-error hover:bg-error/90'
                }`}
              >
                {archiving
                  ? (existingItem?.isArchived ? 'Restoring…' : 'Archiving…')
                  : (existingItem?.isArchived ? 'Restore' : 'Archive')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
