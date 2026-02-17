'use client'

import { useOptimistic } from 'react'
import { Job, Brief } from '@/types/brief'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApproveDialog } from '@/components/briefs/approve-dialog'
import { RejectDialog } from '@/components/briefs/reject-dialog'
import { approveBrief, rejectBrief } from '@/app/actions/approve'
import { CheckCircle, Clock } from 'lucide-react'

interface ApproveListProps {
  jobs: Job[]
}

/**
 * Convert a Job to the Brief type expected by ApproveDialog / RejectDialog
 */
function jobToBrief(job: Job): Brief {
  return {
    id: job.id,
    jobId: job.jobId,
    title: job.title,
    description: job.description,
    template: job.template ?? 'unknown',
    buildable: job.buildable ?? false,
    brief: job.brief ?? '',
    routes: job.routes,
    uniqueInteractions: job.uniqueInteractions,
    createdAt: job.scrapedAt,
    status: 'pending',
  }
}

/**
 * Calculate relative time string from a date
 */
function getRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date

  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/**
 * Format a budget amount with commas
 */
function formatBudget(amount: number): string {
  return `$${amount.toLocaleString()}`
}

export function ApproveList({ jobs }: ApproveListProps) {
  const [optimisticJobs, removeJob] = useOptimistic(
    jobs,
    (currentJobs: Job[], jobIdToRemove: string) =>
      currentJobs.filter((j) => j.id !== jobIdToRemove)
  )

  if (optimisticJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <p className="text-lg text-gray-600">No jobs waiting for approval</p>
        <p className="text-sm text-gray-400 mt-1">
          Check back later for new jobs to review.
        </p>
      </div>
    )
  }

  async function handleApprove(briefId: string, notes: string) {
    removeJob(briefId)
    await approveBrief(briefId, notes)
  }

  async function handleReject(briefId: string, reason: string, notes: string) {
    removeJob(briefId)
    await rejectBrief(briefId, reason, notes)
  }

  return (
    <div className="space-y-3">
        {optimisticJobs.map((job) => {
          const brief = jobToBrief(job)
          const skills = job.skills
            ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : []

          return (
            <Card key={job.id} className="p-4 space-y-3">
              {/* Title and Age */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                  {job.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{getRelativeTime(job.scrapedAt)}</span>
                </div>
              </div>

              {/* Budget */}
              {job.budgetAmount != null && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{formatBudget(job.budgetAmount)}</span>
                  {job.budgetType && (
                    <span className="text-gray-500 ml-1">({job.budgetType})</span>
                  )}
                </div>
              )}

              {/* Buildable Reasoning */}
              {job.buildableReasoning && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {job.buildableReasoning}
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

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <ApproveDialog brief={brief} onApprove={handleApprove} />
                <RejectDialog brief={brief} onReject={handleReject} />
              </div>
            </Card>
          )
        })}
    </div>
  )
}
