'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

interface InboxSectionProps {
  emoji: string
  title: string
  count: number
  description: string
  filter?: string
  children: React.ReactNode
  emptyMessage: string
}

export function InboxSection({
  emoji,
  title,
  count,
  description,
  filter,
  children,
  emptyMessage,
}: InboxSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <TooltipProvider>
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
          <Tooltip>
            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
              <p className="text-sm">{description}</p>
              {filter && (
                <p className="text-xs text-muted-foreground mt-1.5 border-t pt-1.5">
                  <span className="font-medium">Shows:</span> {filter}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
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
    </TooltipProvider>
  )
}
