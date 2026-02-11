'use client'

import { Build } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Clock, ExternalLink, AlertCircle, Zap } from 'lucide-react'

interface BuildCardProps {
  build: Build
}

export function BuildCard({ build }: BuildCardProps) {
  const isBuilding = build.stage === 'approved' && build.status === 'building'
  const isDeployed = build.stage === 'deployed'
  const isFailed = build.stage === 'failed'

  return (
    <div
      className={`
        group relative bg-white rounded-lg border p-4
        transition-all duration-200 hover:shadow-md
        ${isBuilding ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-white' : ''}
        ${isDeployed ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white' : ''}
        ${isFailed ? 'border-red-200 bg-gradient-to-br from-red-50/50 to-white' : ''}
      `}
    >
      {/* Pulse indicator for building */}
      {isBuilding && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm leading-tight mb-2 pr-6 line-clamp-2">
        {build.title}
      </h4>

      {/* Template badge */}
      <div className="mb-3">
        <Badge variant="secondary" className="text-xs">
          {formatTemplate(build.template)}
        </Badge>
      </div>

      {/* Time info */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
        <Clock className="w-3.5 h-3.5" />
        {isBuilding && build.buildStarted ? (
          <span>Started {formatDistanceToNow(new Date(build.buildStarted), { addSuffix: true })}</span>
        ) : build.buildDuration ? (
          <span>{formatDuration(build.buildDuration)}</span>
        ) : (
          <span>{formatDistanceToNow(new Date(build.createdAt), { addSuffix: true })}</span>
        )}
      </div>

      {/* Deployed URL */}
      {isDeployed && build.prototypeUrl && (
        <a
          href={build.prototypeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="truncate">View prototype</span>
        </a>
      )}

      {/* Error message */}
      {isFailed && build.buildError && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 mt-1">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{build.buildError}</span>
        </div>
      )}

      {/* Building progress hint */}
      {isBuilding && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Building prototype...</span>
        </div>
      )}
    </div>
  )
}

function formatTemplate(template?: string): string {
  const templateMap: Record<string, string> = {
    dashboard: 'Dashboard',
    web_app: 'Web App',
    unknown: 'Unknown',
  }
  return templateMap[template || 'unknown'] || template || 'Unknown'
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  return `${minutes}m ${remainingSeconds}s`
}
