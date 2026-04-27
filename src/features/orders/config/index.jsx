import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShellPaths } from '@/hooks/useShellPaths'
import { inventoryApi } from '@/services/api'
import { useApi } from '@/hooks/useApi'
import AcademicKit from './components/AcademicKit'
import OrderSummary from './components/OrderSummary'
import StudentProfile from './components/StudentProfile'
import UniformConfig from './components/UniformConfig'
import { fallbackOrderContext } from './data'
import './styles.scss'

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

    const isBundle = (kitItem.productType ?? 'SET') === 'SET'
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
  if (uniform.includeKit && uniformSizes.length > 0) {
    if (uniform.shirt) {
      const sz = uniformSizes.find((s) => s.categoryName === 'shirt' && s.code === 'M') ?? uniformSizes.find((s) => s.categoryName === 'shirt')
      if (sz) items.push({ itemType: 'UNIFORM', itemId: sz.id, label: `Shirt (${sz.code})`, quantity: 1, unitPrice: Number(sz.price) })
    }
    if (uniform.trousers) {
      const waist = uniform.trousersWaist?.replace(/\D/g, '') ?? '32'
      const sz = uniformSizes.find((s) => s.categoryName === 'pant' && s.code === waist) ?? uniformSizes.find((s) => s.categoryName === 'pant')
      if (sz) items.push({ itemType: 'UNIFORM', itemId: sz.id, label: `Trousers (${sz.code})`, quantity: 1, unitPrice: Number(sz.price) })
    }
    if (uniform.socks) {
      const sz = uniformSizes.find((s) => s.categoryName === 'socks')
      if (sz) items.push({ itemType: 'UNIFORM', itemId: sz.id, label: `Socks (${sz.code})`, quantity: 1, unitPrice: Number(sz.price) })
    }
  }

  return items
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

  const [productSelections, setProductSelections] = useState({})

  const [uniform, setUniform] = useState({
    includeKit: true,
    shirt: true,
    trousers: true,
    socks: true,
    trousersWaist: '32 Waist',
    socksSize: 'L (9-12)',
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
    const rawItems = cls?.bookKit?.items ?? []

    const groupedVariants = new Map()
    const normalized = []
    for (const item of rawItems) {
      const isBundle = (item.productType ?? 'SET') === 'SET'
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
      const isBundle = (item.productType ?? 'SET') === 'SET'
      const subItems = item.subItems ?? []
      const variantOptions = item.variantOptions ?? []
      next[item.id] = existing ?? {
        enabled: true,
        bundleMode: isBundle ? 'full' : null,
        selectedSubItemIds: isBundle ? subItems.map((s) => s.id) : [],
        selectedVariantId: !isBundle ? (variantOptions[0]?.id ?? subItems[0]?.id ?? null) : null,
      }
    }
    return next
  }, [kitItems, productSelections])

  const uniformSizes = useMemo(() => {
    if (!uniformSizesRaw) return []
    return uniformSizesRaw.map((sz) => ({
      ...sz,
      categoryName: sz.category?.name ?? '',
    }))
  }, [uniformSizesRaw])

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
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white/80 px-8 py-4 shadow-sm backdrop-blur-xl dark:bg-stone-900/80 dark:shadow-none">
        <div className="flex flex-col">
          <h1 className="font-headline text-lg font-semibold text-on-surface">Order Management</h1>
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>{selectedClass.name}</span>
            <span className="material-symbols-outlined text-[10px]" aria-hidden>chevron_right</span>
            <span className="text-primary">{selectedSection.name}</span>
          </nav>
        </div>
      </header>
      <main className="ml-0 min-h-screen p-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-8">
              <StudentProfile
                student={student}
                sectionId={selectedSection.id}
                onChangeStudent={() => navigate(paths.ordersNew)}
              />
              <AcademicKit
                kitItems={kitItems}
                selections={effectiveSelections}
                onChange={setProductSelections}
              />
              <UniformConfig value={uniform} onChange={setUniform} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <OrderSummary
                student={student}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                selectedBookItems={bookOrderItems}
                uniform={uniform}
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
