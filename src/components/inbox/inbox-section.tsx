'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface InboxSectionProps {
  emoji: string
  title: string
  count: number
  children: React.ReactNode
  emptyMessage: string
}

export function InboxSection({
  emoji,
  title,
  count,
  children,
  emptyMessage,
}: InboxSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        )}
        <span className="text-base">{emoji}</span>
        <span className="font-semibold text-gray-900 text-sm md:text-base">
          {title}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {count}
        </Badge>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {count === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-3">{children}</div>
          )}
        </div>
      )}
    </div>
  )
}
