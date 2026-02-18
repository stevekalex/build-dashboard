'use client'

import { useState } from 'react'
import { Job } from '@/types/brief'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, XCircle } from 'lucide-react'
import { getAirtableRecordUrl } from '@/lib/utils'
import { markBuildFailed } from '@/app/actions/approve'

interface BuildingListProps {
  jobs: Job[]
  onAction?: () => void
}

const STUCK_THRESHOLD_MS = 60 * 60 * 1000 // 60 minutes

function getBuildTimer(buildStarted?: string): { label: string; isStuck: boolean } {
  if (!buildStarted) return { label: 'Build time unknown', isStuck: false }

  const startTime = new Date(buildStarted).getTime()
  const elapsed = Date.now() - startTime
  const minutes = Math.floor(elapsed / (1000 * 60))
  const isStuck = elapsed > STUCK_THRESHOLD_MS

  if (minutes < 1) return { label: 'Building for <1m', isStuck }
  if (minutes < 60) return { label: `Building for ${minutes}m`, isStuck }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return { label: `Building for ${hours}h ${remainingMinutes}m`, isStuck }
}

export function BuildingList({ jobs, onAction }: BuildingListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  if (jobs.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        No builds in progress
      </div>
    )
  }

  async function handleBuildFailed(jobId: string) {
    setLoadingId(jobId)
    setDismissedIds((prev) => new Set(prev).add(jobId))
    onAction?.()
    try {
      const result = await markBuildFailed(jobId)
      if (!result.success) {
        console.error('markBuildFailed error:', result.error)
        setDismissedIds((prev) => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
      }
    } catch (error) {
      console.error('markBuildFailed failed:', error)
      setDismissedIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    } finally {
      setLoadingId(null)
    }
  }

  const visibleJobs = jobs.filter((j) => !dismissedIds.has(j.id))

  if (visibleJobs.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        No builds in progress
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleJobs.map((job) => {
        const { label, isStuck } = getBuildTimer(job.buildStarted)
        const skills = job.skills
          ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : []

        const airtableUrl = getAirtableRecordUrl(job.id)
        const isLoading = loadingId === job.id

        return (
          <Card
            key={job.id}
            className={`p-4 space-y-3 ${isStuck ? 'border-red-400 border-2' : ''}`}
          >
            {/* Title and Timer */}
            <div
              className="flex items-start justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => airtableUrl && window.open(airtableUrl, '_blank')}
            >
              <h3 className="font-semibold text-gray-900 text-base leading-tight min-w-0 break-words">
                {job.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isStuck ? (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Stuck
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-amber-600 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stuck timer detail */}
            {isStuck && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <Clock className="w-3 h-3" />
                <span>{label}</span>
              </div>
            )}

            {/* Build error */}
            {job.buildError && (
              <p className="text-sm text-red-600 line-clamp-2">
                {job.buildError}
              </p>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            {/* Build Failed button - show when stuck or has error */}
            {(isStuck || job.buildError) && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={isLoading}
                onClick={() => handleBuildFailed(job.id)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {isLoading ? 'Marking Failed...' : 'Build Failed'}
              </Button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
