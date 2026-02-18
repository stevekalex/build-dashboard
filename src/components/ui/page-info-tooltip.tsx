'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

interface PageInfoTooltipProps {
  content: string
  filter?: string
}

export function PageInfoTooltip({ content, filter }: PageInfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center">
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
          <p className="text-sm">{content}</p>
          {filter && (
            <p className="text-xs text-muted-foreground mt-1.5 border-t pt-1.5">
              <span className="font-medium">Shows:</span> {filter}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
