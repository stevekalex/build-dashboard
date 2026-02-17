import { cn } from '@/lib/utils'

interface StageCardProps {
  label: string
  count: number
  maxCount: number
  color: string
  testId: string
}

/**
 * Single stage bar showing label, count, and a proportional-width colored bar.
 * Server component -- no interactivity needed.
 */
export function StageCard({ label, count, maxCount, color, testId }: StageCardProps) {
  const widthPercent = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden relative">
        <div
          data-testid={`stage-bar-${testId}`}
          className={cn('h-full rounded-md transition-all', color)}
          style={{ width: `${widthPercent}%` }}
          role="meter"
          aria-valuenow={count}
          aria-valuemax={maxCount}
          aria-label={`${label}: ${count}`}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-10 text-right">{count}</span>
    </div>
  )
}
