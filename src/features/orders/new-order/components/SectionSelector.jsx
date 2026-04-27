import { useEffect, useRef } from 'react'
import SectionCard from './SectionCard'

export default function SectionSelector({
  selectedClassName,
  sections,
  selectedSection,
  onSelectSection,
}) {
  const rootRef = useRef(null)

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedClassName])

  return (
    <div
      ref={rootRef}
      className="new-order-section-reveal mb-12 rounded-2xl border border-primary/10 bg-primary/5 p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-primary">
          <span className="material-symbols-outlined" data-icon="groups" aria-hidden>
            groups
          </span>
          Sections for {selectedClassName}
        </h2>
        <span className="rounded-full border border-primary/20 bg-white px-3 py-1 text-[10px] font-bold uppercase text-primary">
          {sections.length} Available
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isSelected={selectedSection?.id === section.id}
            onSelect={onSelectSection}
          />
        ))}
      </div>
    </div>
  )
}
