'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Job } from '@/types/brief'
import { LogResponseDialog } from './log-response-dialog'
import { CloseDealDialog } from './close-deal-dialog'
import { markFollowedUp, closeNoResponse, markCallDone } from '@/app/actions/inbox'

type SectionType = 'hot-leads' | 'awaiting-response' | 'follow-ups-due'

interface InboxCardProps {
  job: Job
  section: SectionType
  onAction?: (jobId: string) => void
}

function formatAge(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function formatBudget(amount?: number, type?: string): string {
  if (!amount) return ''
  const formatted = `$${amount.toLocaleString()}`
  if (type) return `${formatted} (${type})`
  return formatted
}

export function InboxCard({ job, section, onAction }: InboxCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  async function handleMarkFollowedUp() {
    setLoadingAction('followup')
    onAction?.(job.id)
    try {
      await markFollowedUp(job.id)
    } catch (error) {
      console.error('Failed to mark as followed up:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleCloseNoResponse() {
    setLoadingAction('close')
    onAction?.(job.id)
    try {
      await closeNoResponse(job.id)
    } catch (error) {
      console.error('Failed to close:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleMarkCallDone() {
    setLoadingAction('call')
    onAction?.(job.id)
    try {
      await markCallDone(job.id)
    } catch (error) {
      console.error('Failed to mark call done:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const budget = formatBudget(job.budgetAmount, job.budgetType)
  const age = formatAge(job.appliedAt || job.scrapedAt)

  return (
    <Card className="py-3">
      <CardContent className="px-4 py-0">
        <div className="flex flex-col gap-2">
          {/* Top row: Title + metadata */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {job.title}
                </h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {job.stage}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {job.client && <span>{job.client}</span>}
                {budget && <span>{budget}</span>}
                {age && <span>{age}</span>}
              </div>
            </div>
            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 shrink-0"
                title="Open on Upwork"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Action buttons - contextual by section */}
          <div className="flex items-center gap-2 flex-wrap">
            {section === 'hot-leads' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkCallDone}
                  disabled={loadingAction === 'call'}
                >
                  {loadingAction === 'call' ? 'Saving...' : 'Mark Call Done'}
                </Button>
                <CloseDealDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
              </>
            )}

            {section === 'awaiting-response' && (
              <LogResponseDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
            )}

            {section === 'follow-ups-due' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkFollowedUp}
                  disabled={loadingAction === 'followup'}
                >
                  {loadingAction === 'followup' ? 'Saving...' : 'Mark Followed Up'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseNoResponse}
                  disabled={loadingAction === 'close'}
                  className="text-gray-500"
                >
                  {loadingAction === 'close' ? 'Closing...' : 'Close No Response'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
