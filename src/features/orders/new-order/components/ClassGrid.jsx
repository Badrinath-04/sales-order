import { useLayoutEffect, useRef } from 'react'
import ClassTile from './ClassTile'

/**
 * Mobile-only: tile flex-basis. Larger divisor => narrower tiles => more of the 4th card visible (~30%).
 * (100vw slightly overstates the scrollport; extra subtraction nudges the peek up vs using raw vw.)
 */
const MOBILE_TILE_WIDTH = 'calc((100vw - 3rem) / 3.58)'

export default function ClassGrid({ classes, selectedClass, onSelectClass }) {
  const selectedRef = useRef(null)

  useLayoutEffect(() => {
    if (!selectedClass || !selectedRef.current) return
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) return
    selectedRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [selectedClass?.id])

  return (
    <div className="mb-4 w-full min-w-0">
      {/* Mobile: single scroll row — 4th card partially visible as scroll hint */}
      <div className="md:hidden">
        <div
          className="-mx-4 overflow-x-auto overflow-y-visible px-4 pb-2 pt-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex w-max gap-2.5 pr-10">
            {classes.map((item) => (
              <div
                key={item.id}
                ref={selectedClass?.id === item.id ? selectedRef : undefined}
                className="shrink-0 snap-start"
                style={{ flex: `0 0 ${MOBILE_TILE_WIDTH}`, maxWidth: MOBILE_TILE_WIDTH }}
              >
                <ClassTile
                  item={item}
                  isSelected={selectedClass?.id === item.id}
                  onSelect={onSelectClass}
                  tileClassName="w-full min-w-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablet & desktop: original grid */}
      <div className="hidden grid-cols-3 gap-3 md:grid md:grid-cols-6">
        {classes.map((item) => (
          <ClassTile
            key={item.id}
            item={item}
            isSelected={selectedClass?.id === item.id}
            onSelect={onSelectClass}
          />
        ))}
      </div>
    </div>
  )
}
