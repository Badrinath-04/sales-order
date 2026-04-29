import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import AcademicKit from './components/AcademicKit'
import OrderSummary from './components/OrderSummary'
import UniformConfig from './components/UniformConfig'
import { fallbackOrderContext } from './data'
import './styles.scss'

function isBundleProduct(item) {
  return (item?.productType ?? 'BUNDLE') !== 'VARIANT'
}

function computeTotals(bookItems, uniformItems) {
  const bookTotal = bookItems.reduce((sum, item) => sum + Number(item.unitPrice), 0)
  const uniformTotal = uniformItems.reduce((sum, item) => sum + Number(item.unitPrice), 0)
  return {
    academicTotal: bookTotal,
    uniformTotal,
    total: bookTotal + uniformTotal + 5, // +5 admin fee
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
          unitPrice: Number(kitItem.setPrice ?? kitItem.price ?? 0),
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
            unitPrice: Number(sub.price ?? 0),
          })
        }
      }
    } else {
      const variants = kitItem.variantOptions ?? kitItem.subItems ?? []
      const selectedVariant = variants.find((variant) => variant.id === selected.selectedVariantId) ?? variants[0]
      items.push({
        itemType: 'BOOK',
        itemId: selectedVariant?.itemId ?? kitItem.id,
        label: selectedVariant ? `${kitItem.label} (${selectedVariant.label})` : kitItem.label,
        quantity: 1,
        unitPrice: Number(selectedVariant?.price ?? kitItem.price ?? 0),
      })
    }
  }

  return items
}

function buildUniformOrderItems(uniform, uniformSizes) {
  const items = []
  if (!uniform.includeKit || uniformSizes.length === 0) return items

  const byId = new Map(uniformSizes.map((s) => [s.id, s]))
  const tryPush = (enabled, sizeId) => {
    if (!enabled || !sizeId) return
    const sz = byId.get(sizeId)
    if (!sz) return
    const itemLabel = sz.categoryLabel ? `${sz.categoryLabel} (${sz.code || sz.name})` : sz.name
    items.push({
      itemType: 'UNIFORM',
      itemId: sz.id,
      label: itemLabel,
      quantity: 1,
      unitPrice: Number(sz.price ?? 0),
    })
  }
  tryPush(uniform.shirt, uniform.selectedShirtSizeId)
  tryPush(uniform.trousers, uniform.selectedTrouserSizeId)
  tryPush(uniform.socks, uniform.selectedSocksSizeId)

  return items
}

function normalizeCategoryName(raw) {
  return String(raw ?? '').trim().toLowerCase()
}

function categoryKeyFromName(name) {
  if (name.includes('shirt')) return 'shirt'
  if (name.includes('pant') || name.includes('trouser')) return 'trousers'
  if (name.includes('sock')) return 'socks'
  return null
}

export default function OrderConfiguration() {
  const location = useLocation()
  const navigate = useNavigate()
  const paths = useShellPaths()

  const {
    selectedStudents = [],
    selectedClass: stClass,
    selectedSection: stSection,
    branchId,
  } = location.state ?? {}

  const fb = fallbackOrderContext
  const selectedClass = stClass ?? fb.selectedClass
  const selectedSection = stSection ?? fb.selectedSection
  const student = selectedStudents[0] ?? fb.student
  const classLabel = selectedClass?.name ?? selectedClass?.label ?? selectedClass?.id ?? '—'
  const sectionLabel = selectedSection?.name ?? selectedSection?.section ?? selectedSection?.id ?? '—'
  const parentName = student.guardian ?? student.guardianName ?? '—'
  const parentPhone = student.parentPhone ?? '—'

  const [productSelections, setProductSelections] = useState({})

  const [uniform, setUniform] = useState({
    includeKit: false,
    shirt: true,
    trousers: true,
    socks: true,
    selectedShirtSizeId: null,
    selectedTrouserSizeId: null,
    selectedSocksSizeId: null,
  })

  // Load book kit for the class
  const fetchBooks = useCallback(() => {
    if (!branchId) return null
    return inventoryApi.listBooks({ branchId })
  }, [branchId])
  const { data: classesWithKits } = useApi(fetchBooks, null, [branchId])

  // Load uniforms
  const fetchUniforms = useCallback(() => inventoryApi.listUniforms({ branchId }), [branchId])
  const { data: uniformSizesRaw } = useApi(fetchUniforms, null, [branchId])

  const kitItems = useMemo(() => {
    if (!classesWithKits) return []
    const classGrade = Number(selectedClass?.id)
    const cls = classesWithKits.find((c) => Number(c.grade) === classGrade && c.section === 'A')
      ?? classesWithKits.find((c) => Number(c.grade) === classGrade)
    const rawItems = (cls?.bookKit?.items ?? []).map((item) => ({
      ...item,
      availableStock: Number(item.bookStocks?.[0]?.quantity ?? 0),
    }))

    const groupedVariants = new Map()
    const normalized = []
    for (const item of rawItems) {
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
  }, [classesWithKits, selectedClass?.id])

  const effectiveSelections = useMemo(() => {
    const next = {}
    for (const item of kitItems) {
      const existing = productSelections[item.id]
      const isBundle = isBundleProduct(item)
      const subItems = item.subItems ?? []
      const variantOptions = item.variantOptions ?? []
      const defaults = {
        enabled: true,
        bundleMode: isBundle ? 'full' : null,
        selectedSubItemIds: isBundle ? subItems.map((s) => s.id) : [],
        selectedVariantId: !isBundle ? (variantOptions[0]?.id ?? subItems[0]?.id ?? null) : null,
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
      }
    }
    return next
  }, [kitItems, productSelections])

  const uniformSizes = useMemo(() => {
    if (!uniformSizesRaw) return []
    return uniformSizesRaw.map((sz) => ({
      ...sz,
      categoryName: normalizeCategoryName(sz.category?.name),
      categoryLabel: sz.category?.label ?? sz.category?.name ?? 'Uniform',
    }))
  }, [uniformSizesRaw])

  const uniformCatalog = useMemo(() => {
    const grouped = { shirt: [], trousers: [], socks: [] }
    for (const size of uniformSizes) {
      const key = categoryKeyFromName(size.categoryName)
      if (!key) continue
      grouped[key].push({
        id: size.id,
        label: size.name ? `${size.name} (${size.code})` : (size.code ?? size.name ?? 'Size'),
        name: size.name ?? size.code ?? 'Size',
        code: size.code ?? size.name ?? 'Size',
        price: Number(size.price ?? 0),
        stock: Number(size.uniformStocks?.[0]?.quantity ?? 0),
        categoryLabel: size.categoryLabel,
      })
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => String(a.label).localeCompare(String(b.label)))
    }
    return grouped
  }, [uniformSizes])

  useEffect(() => {
    setUniform((prev) => ({
      ...prev,
      selectedShirtSizeId: prev.selectedShirtSizeId ?? uniformCatalog.shirt[0]?.id ?? null,
      selectedTrouserSizeId: prev.selectedTrouserSizeId ?? uniformCatalog.trousers[0]?.id ?? null,
      selectedSocksSizeId: prev.selectedSocksSizeId ?? uniformCatalog.socks[0]?.id ?? null,
      shirt: uniformCatalog.shirt.length > 0 ? prev.shirt : false,
      trousers: uniformCatalog.trousers.length > 0 ? prev.trousers : false,
      socks: uniformCatalog.socks.length > 0 ? prev.socks : false,
    }))
  }, [uniformCatalog])

  const bookOrderItems = useMemo(
    () => buildBookOrderItems(kitItems, effectiveSelections),
    [kitItems, effectiveSelections],
  )
  const uniformOrderItems = useMemo(
    () => buildUniformOrderItems(uniform, uniformSizes),
    [uniform, uniformSizes],
  )
  const orderItems = useMemo(() => [...bookOrderItems, ...uniformOrderItems], [bookOrderItems, uniformOrderItems])

  const totals = useMemo(() => {
    return computeTotals(bookOrderItems, uniformOrderItems)
  }, [bookOrderItems, uniformOrderItems])

  const handleConfirmToPayment = () => {
    const studentsOut = selectedStudents.length > 0 ? selectedStudents : [student]
    navigate(paths.ordersPayment, {
      state: {
        selectedStudents: studentsOut,
        selectedClass,
        selectedSection,
        branchId,
        orderItems,
        totals,
      },
    })
  }

  return (
    <div className="order-config min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant/10 bg-white/90 px-8 py-4 shadow-sm backdrop-blur-xl dark:bg-stone-900/85 dark:shadow-none">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <h1 className="font-headline text-lg font-semibold text-on-surface">Order Management</h1>
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <span>{classLabel}</span>
                <span className="material-symbols-outlined text-[10px]" aria-hidden>chevron_right</span>
                <span className="text-primary">{sectionLabel}</span>
              </nav>
            </div>
            <div className="px-2 py-1">
              <div className="flex flex-wrap items-center justify-center gap-3 md:flex-nowrap md:gap-5">
                <div className="rounded-lg bg-primary/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Student Name</p>
                  <p className="whitespace-nowrap text-sm font-semibold text-on-surface">{student.name}</p>
                </div>
                <div className="rounded-lg bg-primary/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Roll Number</p>
                  <p className="whitespace-nowrap text-sm font-semibold text-on-surface">{student.roll}</p>
                </div>
                <div className="rounded-lg bg-primary/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Name</p>
                  <p className="whitespace-nowrap text-sm font-semibold text-on-surface">{parentName}</p>
                </div>
                <div className="rounded-lg bg-primary/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parent Phone</p>
                  <p className="whitespace-nowrap text-sm font-semibold text-on-surface">{parentPhone}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(paths.ordersNew)}
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Change Student
          </button>
        </div>
      </header>
      <main className="ml-0 min-h-screen px-8 py-6">
        <div className="w-full">
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-8">
              <AcademicKit
                kitItems={kitItems}
                selections={effectiveSelections}
                onChange={setProductSelections}
              />
              <UniformConfig value={uniform} onChange={setUniform} catalog={uniformCatalog} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <OrderSummary
                student={student}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                selectedBookItems={bookOrderItems}
                uniform={uniform}
                uniformCatalog={uniformCatalog}
                uniformSubtotal={totals.uniformTotal}
                totalAmount={totals.total}
                onConfirm={handleConfirmToPayment}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
