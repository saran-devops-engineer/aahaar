interface SkeletonProps {
  className?: string
  label?: string
}

export function Skeleton({ className = '', label = 'Loading' }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded-2xl ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    />
  )
}

export function MealSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading meals">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton className="h-28 w-full" label={`Loading meal ${i + 1}`} />
        </li>
      ))}
    </ul>
  )
}
