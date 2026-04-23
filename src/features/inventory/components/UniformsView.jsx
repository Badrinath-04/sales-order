import { useMemo, useState } from 'react'
import { ROLES } from '../../../config/navigation'
import { useAdminSession } from '../../../context/useAdminSession'
import { uniformCategories as uniformCategoriesSeed, sizeInventory } from '../data'
import SizeInventory from './SizeInventory'
import UniformCategory from './UniformCategory'

export default function UniformsView() {
  const { role } = useAdminSession()
  const canManageStock = role === ROLES.SUPER_ADMIN
  const [categories, setCategories] = useState(uniformCategoriesSeed)

  const selectedCategory = useMemo(
    () => categories.find((c) => c.selected) ?? categories[0],
    [categories],
  )

  const handleSelectCategory = (id) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        selected: category.id === id,
      })),
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <UniformCategory categories={categories} onSelect={handleSelectCategory} />
      <SizeInventory
        key={selectedCategory.id}
        categoryLabel={selectedCategory.label}
        rows={sizeInventory}
        canManageStock={canManageStock}
      />
      <div className="fixed bottom-8 right-8 z-50">
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl" data-icon="inventory" aria-hidden>
            inventory
          </span>
        </button>
      </div>
    </div>
  )
}
