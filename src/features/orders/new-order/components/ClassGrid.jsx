import ClassTile from './ClassTile'

export default function ClassGrid({ classes, selectedClass, onSelectClass }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-3 md:grid-cols-6">
      {classes.map((item) => (
        <ClassTile
          key={item.id}
          item={item}
          isSelected={selectedClass?.id === item.id}
          onSelect={onSelectClass}
        />
      ))}
    </div>
  )
}
