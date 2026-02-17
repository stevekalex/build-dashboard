'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DueTimeBadgeProps {
  nextActionDate?: string
}

type Urgency = 'overdue' | 'critical' | 'warning' | 'soon' | 'tomorrow' | 'upcoming' | 'later' | 'none'

function getUrgency(diffMs: number): Urgency {
  if (diffMs <= 0) return 'overdue'
  if (diffMs <= 60 * 60 * 1000) return 'critical'           // < 1h
  if (diffMs <= 4 * 60 * 60 * 1000) return 'warning'        // 1h – 4h
  if (diffMs <= 24 * 60 * 60 * 1000) return 'soon'          // 4h – 24h
  if (diffMs <= 2 * 24 * 60 * 60 * 1000) return 'tomorrow'  // 1d – 2d
  if (diffMs <= 7 * 24 * 60 * 60 * 1000) return 'upcoming'  // 2d – 7d
  return 'later'                                              // 7d+
}

const urgencyStyles: Record<Urgency, string> = {
  overdue:  'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-orange-100 text-orange-800 border-orange-200',
  warning:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  soon:     'bg-blue-100 text-blue-700 border-blue-200',
  tomorrow: 'bg-slate-100 text-slate-700 border-slate-200',
  upcoming: 'bg-gray-100 text-gray-600 border-gray-200',
  later:    'bg-gray-50 text-gray-500 border-gray-200',
  none:     'bg-gray-50 text-gray-400 border-dashed border-gray-300',
}

function formatDueTime(nextActionDate: string): { label: string; urgency: Urgency } {
  const now = new Date()
  const due = new Date(nextActionDate)
  const diffMs = due.getTime() - now.getTime()
  const absDiffMs = Math.abs(diffMs)

  const minutes = Math.floor(absDiffMs / (1000 * 60))
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60))
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)

  const urgency = getUrgency(diffMs)

  if (diffMs <= 0) {
    // Overdue
    if (minutes < 60) return { label: `${minutes}m overdue`, urgency }
    if (hours < 24) return { label: `${hours}h overdue`, urgency }
    if (days < 7) return { label: `${days}d overdue`, urgency }
    if (weeks < 8) return { label: `${weeks}w overdue`, urgency }
    return { label: `${Math.floor(days / 30)}mo overdue`, urgency }
  }

  // Future
  if (minutes < 2) return { label: '1m left', urgency }
  if (minutes < 60) return { label: `${minutes}m left`, urgency }
  if (hours < 2) {
    const remainingMins = minutes - hours * 60
    return { label: remainingMins > 0 ? `${hours}h ${remainingMins}m left` : `${hours}h left`, urgency }
  }
  if (hours < 24) return { label: `${hours}h left`, urgency }
  if (days === 1) return { label: 'due tomorrow', urgency }
  if (days < 7) return { label: `due in ${days} days`, urgency }
  if (weeks === 1) return { label: 'due in 1 week', urgency }
  if (weeks < 8) return { label: `due in ${weeks} weeks`, urgency }
  return { label: `due in ${Math.floor(days / 30)} months`, urgency }
}

export function DueTimeBadge({ nextActionDate }: DueTimeBadgeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!nextActionDate) {
    return (
      <Badge variant="outline" className={cn('text-[10px] leading-tight', urgencyStyles.none)}>
        No date set
      </Badge>
    )
  }

  // Render placeholder on server / first client render to avoid hydration mismatch
  // (server time !== client time produces different labels)
  if (!mounted) {
    return (
      <Badge variant="outline" className={cn('text-[10px] leading-tight', urgencyStyles.later)}>
        &nbsp;
      </Badge>
    )
  }

  const { label, urgency } = formatDueTime(nextActionDate)

  return (
    <Badge variant="outline" className={cn('text-[10px] leading-tight', urgencyStyles[urgency])}>
      {label}
    </Badge>
  )
}
