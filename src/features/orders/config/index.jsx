import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import { usePermission } from '@/hooks/usePermission'
import { useSidebar } from '@/context/SidebarContext'
import AcademicKit from './components/AcademicKit'
import NotebooksSection from './components/NotebooksSection'
import OrderSummary from './components/OrderSummary'
import UniformConfig from './components/UniformConfig'
import StudentSummaryCard from './components/StudentSummaryCard'
import CombinedTotalBar from './components/CombinedTotalBar'
import './styles.scss'

function isBundleProduct(item) {
  return (item?.productType ?? 'BUNDLE') !== 'VARIANT'
}

function isTextbookProduct(item) {
  const label = String(item?.label ?? '').toLowerCase()
  const catalogKey = String(item?.catalogKey ?? '')
  return (
    label.includes('textbook')
    || catalogKey.startsWith('academic_textbooks_')
    || catalogKey.startsWith('gov_textbook_g')
  )
}

function isNotebookBundle(item) {
  return String(item?.catalogKey ?? '').startsWith('notebooks_bundle')
}

/** Round a monetary value up to the nearest whole rupee (ceiling). */
function roundPrice(value) {
  return Math.ceil(Number(value) || 0)
}

function roundUpToNearestFive(value) {
  return Math.ceil((Number(value) || 0) / 5) * 5
}

function computeTotals(bookItems, notebookItems, uniformItems) {
  const bookTotal = bookItems.reduce((sum, item) => sum + roundPrice(Number(item.unitPrice) * Number(item.quantity ?? 1)), 0)
  const notebookTotal = notebookItems.reduce((sum, item) => sum + roundPrice(Number(item.unitPrice) * Number(item.quantity ?? 1)), 0)
  const uniformTotal = uniformItems.reduce((sum, item) => sum + roundPrice(Number(item.unitPrice) * Number(item.quantity ?? 1)), 0)
  const rawTotal = bookTotal + notebookTotal + uniformTotal
  return {
    academicTotal: bookTotal,
    notebookTotal,
    uniformTotal,
    total: roundUpToNearestFive(rawTotal),  // class bundle totals are rounded up to nearest ₹5
  }
}

function buildBookOrderItems(kitItems, selections) {
  const items = []

  for (const kitItem of kitItems) {
    const selected = selections[kitItem.id]
    if (!selected?.enabled) continue

    const isBundle = isBundleProduct(kitItem)
    if (isBundle) {
      if (selected.bundleMode === 'full') {
        items.push({
          itemType: 'BOOK',
          itemId: kitItem.id,
          label: `${kitItem.label} (Full Bundle)`,
          quantity: 1,
          unitPrice: roundPrice(kitItem.setPrice ?? kitItem.price ?? 0),
        })
      } else {
        const subItems = kitItem.subItems ?? []
        for (const sub of subItems) {
          if (!selected.selectedSubItemIds?.includes(sub.id)) continue
          items.push({
            itemType: 'BOOK',
            itemId: kitItem.id,
            label: `${kitItem.label} - ${sub.label}`,
            quantity: 1,
            unitPrice: roundPrice(sub.price ?? 0),
          })
        }
      }
    } else {
      const variants = kitItem.variantOptions ?? kitItem.subItems ?? []
      const selectedIds = Array.isArray(selected.selectedVariantIds) && selected.selectedVariantIds.length
        ? selected.selectedVariantIds
        : (selected.selectedVariantId ? [selected.selectedVariantId] : [variants[0]?.id].filter(Boolean))

      for (const id of selectedIds) {
        const v = variants.find((x) => x.id === id)
        if (!v) continue
        items.push({
          itemType: 'BOOK',
          itemId: v?.itemId ?? kitItem.id,
          label: `${kitItem.label} (${v.label})`,
          quantity: 1,
          unitPrice: roundPrice(v?.price ?? 0),
        })
      }
    }
  }

  return items
}

function buildNotebookOrderItems(notebookBundle, quantities, bundleMode = 'full') {
  if (!notebookBundle) return []
  const subItems = (notebookBundle.subItems ?? []).filter((s) => s.isActive !== false)
  const isDefaultSelection = subItems.every((sub) => Number(quantities[sub.id] ?? sub.quantity ?? 0) === Number(sub.quantity ?? 0))

  if (bundleMode === 'full' && isDefaultSelection && notebookBundle.setPrice != null) {
    return [{
      itemType: 'BOOK',
      itemId: notebookBundle.id,
      label: notebookBundle.label ?? 'Notebook Bundle',
      quantity: 1,
      unitPrice: roundPrice(notebookBundle.setPrice ?? 0),
    }]
  }

  const items = []

  for (const sub of subItems) {
    const qty = quantities[sub.id] ?? Number(sub.quantity ?? 0)
    if (qty <= 0) continue
    items.push({
      itemType: 'BOOK',
      itemId: notebookBundle.id,
      label: sub.label,
      quantity: qty,
      unitPrice: roundPrice(sub.price ?? 33),
    })
  }

  return items
}

function buildUniformOrderItems(uniform, uniformSizes) {
  const items = []
  if (!uniform.includeKit || uniformSizes.length === 0) return items

  const byId = new Map(uniformSizes.map((s) => [s.id, s]))
  const selections = uniform.selections ?? {}
  const tryPush = (enabled, sizeId, quantity = 1) => {
    if (!enabled || !sizeId) return
    const sz = byId.get(sizeId)
    if (!sz) return
    const qty = Math.max(1, Math.floor(Number(quantity ?? 1)))
    const itemLabel = sz.categoryLabel ? `${sz.categoryLabel} (${sz.code || sz.name})` : sz.name
    items.push({
      itemType: 'UNIFORM',
      itemId: sz.id,
      label: itemLabel,
      quantity: qty,
      unitPrice: roundPrice(sz.price ?? 0),
    })
  }
  for (const selected of Object.values(selections)) {
    tryPush(selected?.enabled, selected?.selectedSizeId, selected?.quantity)
  }

  return items
}

const PRICE_LIST_TOTALS = {
  [-2]: 2200,
  [-1]: 2865,
  [0]: 3145,
  [1]: 4000,
  [2]: 4085,
  [3]: 4780,
  [4]: 7270,
  [5]: 7380,
  [6]: 4875,
  [7]: 5300,
  [8]: 6550,
  [9]: 6830,
  [10]: 6100,
}

function formatUniformStockLabel(stock) {
  const qty = Number(stock ?? 0)
  if (qty >= 0 && qty < 10) return String(qty).padStart(2, '0')
  return qty.toLocaleString('en-US')
}

function uniformOptionLabel(size, stock) {
  const stockLabel = formatUniformStockLabel(stock)
  if (size.code === 'ONE') return `One Size (${stockLabel})`
  return `${size.name ?? size.code ?? 'Size'} (${stockLabel})`
}

export default function OrderConfiguration() {
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()
  const canPlaceBookOrders = usePermission('canPlaceOrders')
  const canPlaceUniformOrders = usePermission('canCreateUniformOrders')

  const { isDesktopCollapsed } = useSidebar()

  const {
    selectedStudents = [],
    selectedClass: stClass,
    selectedSection: stSection,
    branchId,
    existingOrderSummary,
  } = location.state ?? {}

  const { multiStudentOrder } = location.state ?? {}
  const completedStudents = multiStudentOrder?.completedStudents ?? []

  const hasWizardState = Boolean(
    branchId && selectedStudents?.length && stClass && stSection,
  )

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  useEffect(() => {
    if (!hasWizardState) {
      navigate(paths.ordersNew, { replace: true })
    }
  }, [hasWizardState, navigate, paths.ordersNew])

  const selectedClass = stClass
  const selectedSection = stSection
  const student = selectedStudents[0]

  const [productSelections, setProductSelections] = useState({})
  const [notebookQuantities, setNotebookQuantities] = useState({})
  const [notebookBundleMode, setNotebookBundleMode] = useState('full')
  const [notebooksSectionEnabled, setNotebooksSectionEnabled] = useState(true)

  const [uniform, setUniform] = useState({
    includeKit: true,
    selections: {},
  })

  // Load book kit for the class
  const fetchBooks = useCallback(() => {
    if (!branchId) return null
    return inventoryApi.listBooks({ branchId })
  }, [branchId])
  const { data: classesWithKits, loading: booksLoading } = useApi(fetchBooks, null, [branchId])

  // Load uniforms
  const fetchUniforms = useCallback(() => inventoryApi.listUniforms({ branchId }), [branchId])
  const { data: uniformSizesRaw } = useApi(fetchUniforms, null, [branchId])

  // Resolve the academic class matching the selected grade/section
  const resolvedClass = useMemo(() => {
    if (!classesWithKits) return null
    // selectedClass.id may be a grade number (e.g. "-2") or a DB class id
    const gradeNum = Number(selectedClass?.id)
    const byGrade = Number.isFinite(gradeNum)
      ? (classesWithKits.find((c) => Number(c.grade) === gradeNum && c.section === 'A')
          ?? classesWithKits.find((c) => Number(c.grade) === gradeNum))
      : null
    // Fall back to matching by DB id
    const byId = byGrade ?? classesWithKits.find((c) => c.id === selectedClass?.id)
    return byId ?? null
  }, [classesWithKits, selectedClass])

  const rawKitItems = useMemo(() => {
    if (!resolvedClass) return []
    return (resolvedClass?.bookKit?.items ?? []).map((item) => ({
      ...item,
      availableStock: Number(item.bookStocks?.[0]?.quantity ?? 0),
    }))
  }, [resolvedClass])

  const rawNotebookKitItems = useMemo(() => {
    if (!resolvedClass) return []
    return (resolvedClass?.notebookBookKit?.items ?? []).map((item) => ({
      ...item,
      availableStock: Number(item.bookStocks?.[0]?.quantity ?? 0),
    }))
  }, [resolvedClass])

  const notebookBundle = useMemo(
    () => rawNotebookKitItems.find((item) => isNotebookBundle(item) && !item.isArchived) ?? null,
    [rawNotebookKitItems],
  )

  const kitItems = useMemo(() => {
    const nonNotebook = rawKitItems.filter((item) => !item.isArchived)

    const groupedVariants = new Map()
    const normalized = []
    for (const item of nonNotebook) {
      const isBundle = isBundleProduct(item)
      if (isBundle) {
        normalized.push(item)
        continue
      }

      const explicitGroupKey = item.catalogKey ? `variant:${item.catalogKey}` : null
      const derivedBaseLabel = String(item.label).includes(' - ')
        ? item.label.split(' - ').slice(0, -1).join(' - ').trim()
        : item.label
      const groupKey = explicitGroupKey ?? `variant-label:${derivedBaseLabel.toLowerCase()}`

      if (!groupedVariants.has(groupKey)) {
        groupedVariants.set(groupKey, {
          id: groupKey,
          label: derivedBaseLabel,
          icon: item.icon,
          productType: 'VARIANT',
          availableStock: Number(item.availableStock ?? 0),
          variantOptions: [],
        })
      }
      const group = groupedVariants.get(groupKey)
      const variantLabel = String(item.label).includes(' - ')
        ? item.label.split(' - ').slice(-1)[0].trim()
        : item.label
      group.variantOptions.push({
        id: item.id,
        itemId: item.id,
        label: variantLabel,
        price: item.price,
      })
    }

    for (const group of groupedVariants.values()) {
      group.variantOptions.sort((a, b) => String(a.label).localeCompare(String(b.label)))
      normalized.push(group)
    }
    return normalized
  }, [rawKitItems])

  const effectiveSelections = useMemo(() => {
    const gradeNum = Number(selectedClass?.id)
    const textbooksUncheckedByDefault = gradeNum === 10
    const next = {}
    for (const item of kitItems) {
      const existing = productSelections[item.id]
      const isBundle = isBundleProduct(item)
      const subItems = item.subItems ?? []
      const variantOptions = item.variantOptions ?? []
      const defaults = {
        enabled: textbooksUncheckedByDefault && isTextbookProduct(item) ? false : true,
        bundleMode: isBundle ? 'full' : null,
        selectedSubItemIds: isBundle ? subItems.map((s) => s.id) : [],
        selectedVariantId: !isBundle ? (variantOptions[0]?.id ?? subItems[0]?.id ?? null) : null,
        selectedVariantIds: !isBundle ? [variantOptions[0]?.id ?? subItems[0]?.id].filter(Boolean) : [],
      }
      next[item.id] = {
        ...defaults,
        ...(existing ?? {}),
        selectedSubItemIds: isBundle
          ? (Array.isArray(existing?.selectedSubItemIds) ? existing.selectedSubItemIds : defaults.selectedSubItemIds)
          : [],
        selectedVariantId: !isBundle
          ? (existing?.selectedVariantId ?? defaults.selectedVariantId)
          : null,
        selectedVariantIds: !isBundle
          ? (Array.isArray(existing?.selectedVariantIds) ? existing.selectedVariantIds : (existing?.selectedVariantId ? [existing.selectedVariantId] : defaults.selectedVariantIds))
          : [],
      }
    }
    return next
  }, [kitItems, productSelections, selectedClass?.id])

  // Initialise notebook quantities to bundle defaults whenever the bundle changes
  useEffect(() => {
    if (!notebookBundle) return
    setNotebookQuantities((prev) => {
      const next = { ...prev }
      for (const sub of (notebookBundle.subItems ?? [])) {
        if (typeof next[sub.id] === 'undefined') {
          next[sub.id] = Number(sub.quantity ?? 0)
        }
      }
      return next
    })
  }, [notebookBundle])

  // Full Bundle mode matches the catalog defaults — reset qty when switching back from Selected Sub-items
  useEffect(() => {
    if (!notebookBundle || notebookBundleMode !== 'full') return
    setNotebookQuantities((prev) => {
      const next = { ...prev }
      for (const sub of (notebookBundle.subItems ?? [])) {
        next[sub.id] = Number(sub.quantity ?? 0)
      }
      return next
    })
  }, [notebookBundleMode, notebookBundle])

  useEffect(() => {
    setNotebookBundleMode('full')
    setNotebooksSectionEnabled(true)
  }, [notebookBundle?.id])

  const uniformSizes = useMemo(() => {
    if (!uniformSizesRaw) return []
    return uniformSizesRaw.map((sz) => ({
      ...sz,
      categoryLabel: sz.category?.label ?? sz.category?.name ?? 'Uniform',
    }))
  }, [uniformSizesRaw])

  const uniformCatalog = useMemo(() => {
    const categoryMap = new Map()
    for (const size of uniformSizes) {
      const categoryLabel = size.categoryLabel
      const key = size.category?.name
      if (!key) continue
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          key,
          label: categoryLabel,
          icon: size.category?.icon ?? 'apparel',
          position: Number(size.category?.position ?? 0),
          options: [],
        })
      }
      categoryMap.get(key).options.push({
        id: size.id,
        label: uniformOptionLabel(size, Number(size.uniformStocks?.[0]?.quantity ?? 0)),
        name: size.name ?? size.code ?? 'Size',
        code: size.code ?? size.name ?? 'Size',
        price: Number(size.price ?? 0),
        stock: Number(size.uniformStocks?.[0]?.quantity ?? 0),
        categoryLabel: size.categoryLabel,
      })
    }
    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => a.position - b.position || String(a.label).localeCompare(String(b.label)),
    )
    for (const category of categories) {
      category.options.sort((a, b) => {
        const aNum = Number(a.code)
        const bNum = Number(b.code)
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
        return String(a.label).localeCompare(String(b.label))
      })
    }
    return {
      categories,
      byKey: Object.fromEntries(categories.map((category) => [category.key, category.options])),
    }
  }, [uniformSizes])

  useEffect(() => {
    setUniform((prev) => ({
      ...prev,
      selections: uniformCatalog.categories.reduce((next, category) => {
        const current = prev.selections?.[category.key] ?? {}
        next[category.key] = {
          enabled: category.options.length > 0 ? Boolean(current.enabled) : false,
          selectedSizeId: current.selectedSizeId ?? category.options[0]?.id ?? null,
          quantity: Math.max(1, Math.floor(Number(current.quantity ?? 1))),
        }
        return next
      }, {}),
    }))
  }, [uniformCatalog])

  const bookOrderItems = useMemo(
    () => (canPlaceBookOrders ? buildBookOrderItems(kitItems, effectiveSelections) : []),
    [canPlaceBookOrders, kitItems, effectiveSelections],
  )
  const notebookOrderItems = useMemo(
    () =>
      canPlaceBookOrders && notebooksSectionEnabled && notebookBundle
        ? buildNotebookOrderItems(notebookBundle, notebookQuantities, notebookBundleMode)
        : [],
    [canPlaceBookOrders, notebooksSectionEnabled, notebookBundle, notebookQuantities, notebookBundleMode],
  )
  const uniformOrderItems = useMemo(
    () => (canPlaceUniformOrders ? buildUniformOrderItems(uniform, uniformSizes) : []),
    [canPlaceUniformOrders, uniform, uniformSizes],
  )

  const orderItems = useMemo(
    () => [...bookOrderItems, ...notebookOrderItems, ...uniformOrderItems],
    [bookOrderItems, notebookOrderItems, uniformOrderItems],
  )

  const totals = useMemo(
    () => computeTotals(bookOrderItems, notebookOrderItems, uniformOrderItems),
    [bookOrderItems, notebookOrderItems, uniformOrderItems],
  )

  const displayedTotals = useMemo(() => {
    const gradeNum = Number(selectedClass?.id)
    const priceListTotal = PRICE_LIST_TOTALS[gradeNum]
    const qtyMatchDefault = !notebookBundle || (notebookBundle.subItems ?? []).every(
      (sub) => Number(notebookQuantities[sub.id] ?? sub.quantity ?? 0) === Number(sub.quantity ?? 0),
    )
    const notebookIsDefault =
      notebooksSectionEnabled
      && (!notebookBundle || (qtyMatchDefault && notebookBundleMode === 'full'))
    const academicIsDefault = Object.keys(productSelections).length === 0
    const hasUniformItems = uniformOrderItems.length > 0

    // Only snap to published price-list total when selected line items already cover it.
    // Prevents charging full kit price while only notebook (or partial) items are in the order.
    if (
      canPlaceBookOrders
      && priceListTotal
      && notebookIsDefault
      && academicIsDefault
      && !hasUniformItems
      && Math.abs(totals.total - priceListTotal) <= 150
    ) {
      return { ...totals, total: priceListTotal }
    }
    return totals
  }, [canPlaceBookOrders, notebookBundle, notebookQuantities, notebookBundleMode, notebooksSectionEnabled, productSelections, selectedClass, totals, uniformOrderItems])

  const handleNotebookQtyChange = useCallback((subItemId, qty) => {
    setNotebookQuantities((prev) => ({ ...prev, [subItemId]: qty }))
  }, [])

  const handleConfirmToPayment = () => {
    const itemSum = orderItems.reduce(
      (sum, item) => sum + roundPrice(Number(item.unitPrice) * Number(item.quantity ?? 1)),
      0,
    )
    if (displayedTotals.total - itemSum > 150) {
      window.alert(
        'Selected items do not match the order total. Please enable all required kit bundles (Textbook / Workbook) before continuing.',
      )
      return
    }

    // Multi-student path: add current student to completedStudents and go to payment
    if (completedStudents.length > 0) {
      const currentStudentData = {
        student,
        selectedClass,
        selectedSection,
        orderItems,
        totals: displayedTotals,
        notes: '',
        discountAmount: 0,
      }
      const allStudents = [...completedStudents, currentStudentData]
      navigate(paths.ordersPayment, {
        state: {
          selectedStudents: [student],
          selectedClass,
          selectedSection,
          branchId,
          orderItems,
          totals: displayedTotals,
          multiStudentOrder: { branchId, completedStudents: allStudents },
        },
      })
      return
    }
    // Single student: existing behaviour below
    const studentsOut = selectedStudents.length > 0 ? selectedStudents : [student]
    navigate(paths.ordersPayment, {
      state: {
        selectedStudents: studentsOut,
        selectedClass,
        selectedSection,
        branchId,
        orderItems,
        totals: displayedTotals,
      },
    })
  }

  const handleAddStudent = () => {
    const currentStudentData = {
      student,
      selectedClass,
      selectedSection,
      orderItems,
      totals: displayedTotals,
      notes: '',
      discountAmount: 0,
    }
    const updatedMultiOrder = {
      branchId,
      completedStudents: [...completedStudents, currentStudentData],
    }
    navigate(paths.ordersNew, {
      state: { multiStudentOrder: updatedMultiOrder, returnFromMultiStudent: true },
    })
  }

  const handleEditCompletedStudent = (index) => {
    const toEdit = completedStudents[index]
    const remainingStudents = completedStudents.filter((_, i) => i !== index)
    const updatedMultiOrder = { branchId, completedStudents: remainingStudents }
    navigate(paths.ordersConfigure, {
      state: {
        selectedStudents: [toEdit.student],
        selectedClass: toEdit.selectedClass,
        selectedSection: toEdit.selectedSection,
        branchId,
        multiStudentOrder: updatedMultiOrder,
      },
    })
  }

  const handleRemoveCompletedStudent = (index) => {
    const remaining = completedStudents.filter((_, i) => i !== index)
    const updatedMultiOrder = remaining.length > 0 ? { branchId, completedStudents: remaining } : null
    navigate(paths.ordersConfigure, {
      replace: true,
      state: { ...location.state, multiStudentOrder: updatedMultiOrder },
    })
  }

  if (!hasWizardState || !student) {
    return null
  }

  const classLabel = selectedClass?.name ?? selectedClass?.label ?? selectedClass?.id ?? '—'
  const sectionLabel = selectedSection?.name ?? selectedSection?.section ?? selectedSection?.id ?? '—'
  const parentName = student.guardian ?? student.guardianName ?? '—'
  const parentPhone = student.parentPhone ?? '—'

  return (
    <div className={`order-config min-h-screen bg-surface text-on-surface${completedStudents.length > 0 ? ' pb-32' : ''}`}>
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant/10 bg-white px-4 shadow-sm dark:bg-stone-900 md:bg-white/90 md:px-8 md:py-4 md:shadow-sm md:backdrop-blur-xl dark:md:bg-stone-900/85 max-md:py-3 md:transition-[padding] md:duration-200">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between max-md:gap-2">
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div className="flex flex-col">
              <h1 className="font-headline text-base font-semibold text-on-surface md:text-lg">Order Management</h1>
              <nav className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <span>{classLabel}</span>
                <span className="material-symbols-outlined text-[10px]" aria-hidden>chevron_right</span>
                <span className="text-primary">{sectionLabel}</span>
              </nav>
            </div>
            {/* Student info: 2×2 grid on mobile, flex row on desktop */}
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-nowrap md:items-center md:gap-5">
              <div className="rounded-lg bg-primary/[0.08] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Student Name</p>
                <p className="truncate text-sm font-semibold text-on-surface">{student.name}</p>
              </div>
              <div className="rounded-lg bg-primary/[0.08] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Roll Number</p>
                <p className="truncate text-sm font-semibold text-on-surface">{student.roll}</p>
              </div>
              <div className="rounded-lg bg-primary/[0.08] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Name</p>
                <p className="truncate text-sm font-semibold text-on-surface">{parentName}</p>
              </div>
              <div className="rounded-lg bg-primary/[0.08] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Phone</p>
                <p className="truncate text-sm font-semibold text-on-surface">{parentPhone}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low md:w-auto"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>arrow_back</span>
            Back
          </button>
        </div>
      </header>
      {/* Completed students in this multi-student order */}
      {completedStudents.length > 0 && (
        <div className="px-4 pt-4 md:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Students in this order
          </p>
          {completedStudents.map((s, i) => (
            <StudentSummaryCard
              key={i}
              studentData={s}
              onEdit={() => handleEditCompletedStudent(i)}
              onRemove={() => handleRemoveCompletedStudent(i)}
            />
          ))}
        </div>
      )}
      {existingOrderSummary?.length > 0 && (
        <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-tertiary-fixed/20 px-4 py-3 text-sm md:mx-8">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-on-tertiary-fixed">info</span>
          <div>
            <p className="font-semibold text-on-surface">This student has existing orders</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {existingOrderSummary.slice(0, 3).join(' · ')}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">This is informational only.</p>
          </div>
        </div>
      )}
      <main className="ml-0 min-h-screen px-4 py-4 md:px-8 md:py-6">
        <div className="w-full">
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-8">
              {canPlaceBookOrders && (
                <>
                  <AcademicKit
                    kitItems={kitItems}
                    selections={effectiveSelections}
                    onChange={setProductSelections}
                    loading={booksLoading}
                  />
                  <NotebooksSection
                    notebookBundle={notebookBundle}
                    quantities={notebookQuantities}
                    onQuantityChange={handleNotebookQtyChange}
                    bundleMode={notebookBundleMode}
                    onBundleModeChange={setNotebookBundleMode}
                    sectionEnabled={notebooksSectionEnabled}
                    onSectionEnabledChange={setNotebooksSectionEnabled}
                    loading={booksLoading}
                  />
                </>
              )}
              {canPlaceUniformOrders && <UniformConfig value={uniform} onChange={setUniform} catalog={uniformCatalog} />}
            </div>
            <div className="col-span-12 lg:col-span-4">
              <OrderSummary
                student={student}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                selectedBookItems={bookOrderItems}
                notebookItems={notebookOrderItems}
                notebookSubtotal={displayedTotals.notebookTotal}
                uniform={uniform}
                uniformCatalog={uniformCatalog}
                uniformSubtotal={displayedTotals.uniformTotal}
                totalAmount={displayedTotals.total}
                onConfirm={handleConfirmToPayment}
                onAddStudent={handleAddStudent}
              />
            </div>
          </div>
        </div>
      </main>
      {/* Combined total bar — only in multi-student mode */}
      {completedStudents.length > 0 && (
        <CombinedTotalBar
          completedStudents={completedStudents}
          currentTotal={displayedTotals?.total}
          onAddStudent={handleAddStudent}
          onConfirmAndPay={handleConfirmToPayment}
          isDesktopCollapsed={isDesktopCollapsed}
        />
      )}
    </div>
  )
}
