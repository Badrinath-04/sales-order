import { useState } from 'react'
import { classList } from '../data'
import ClassGrid from './ClassGrid'
import KitDetails from './KitDetails'

export default function BooksView() {
  const [selectedClassId, setSelectedClassId] = useState('06')

  return (
    <>
      <div className="grid grid-cols-12 gap-8">
        <ClassGrid
          classes={classList}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
        />
        <KitDetails key={selectedClassId} selectedClassId={selectedClassId} />
      </div>
      <button
        type="button"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-white shadow-2xl transition-transform hover:scale-110 active:scale-90"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden>
          add
        </span>
      </button>
    </>
  )
}
