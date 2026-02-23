'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Job } from '@/types/brief'
import { LogResponseDialog } from './log-response-dialog'
import { CloseDealDropdown } from './close-deal-dropdown'
import { DueTimeBadge } from './due-time-badge'
import { markFollowedUp, closeNoResponse, markCallDone, advanceResponseType } from '@/app/actions/inbox'
import { getAirtableRecordUrl } from '@/lib/utils'

export type HotLeadColumn = 'shortlist' | 'interview' | 'hire'
type SectionType = 'hot-leads' | 'awaiting-response' | 'follow-ups'

interface InboxCardProps {
  job: Job
  section: SectionType
  hotLeadColumn?: HotLeadColumn
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

const ADVANCE_MAP: Partial<Record<HotLeadColumn, { label: string; target: 'Interview' | 'Hire' }>> = {
  shortlist: { label: 'Move to Interview', target: 'Interview' },
  interview: { label: 'Move to Hire', target: 'Hire' },
}

export function InboxCard({ job, section, hotLeadColumn, onAction }: InboxCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleMarkFollowedUp() {
    setLoadingAction('followup')
    setError(null)
    const result = await markFollowedUp(job.id)
    if (!result.success) {
      setError(result.error || 'Failed to mark as followed up')
    } else {
      onAction?.(job.id)
    }
    setLoadingAction(null)
  }

  async function handleCloseNoResponse() {
    setLoadingAction('close')
    setError(null)
    const result = await closeNoResponse(job.id)
    if (!result.success) {
      setError(result.error || 'Failed to close')
    } else {
      onAction?.(job.id)
    }
    setLoadingAction(null)
  }

  async function handleMarkCallDone() {
    setLoadingAction('call')
    setError(null)
    const result = await markCallDone(job.id)
    if (!result.success) {
      setError(result.error || 'Failed to mark call done')
    }
    setLoadingAction(null)
  }

  async function handleAdvance() {
    if (!hotLeadColumn) return
    const advance = ADVANCE_MAP[hotLeadColumn]
    if (!advance) return
    setLoadingAction('advance')
    setError(null)
    const result = await advanceResponseType(job.id, advance.target)
    if (!result.success) {
      setError(result.error || 'Failed to advance response type')
    } else {
      onAction?.(job.id)
    }
    setLoadingAction(null)
  }

  const budget = formatBudget(job.budgetAmount, job.budgetType)
  const age = formatAge(job.appliedAt || job.scrapedAt)
  const airtableUrl = getAirtableRecordUrl(job.id)

  return (
    <Card className="py-3 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => airtableUrl && window.open(airtableUrl, '_blank')}>
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
                <DueTimeBadge nextActionDate={job.nextActionDate} />
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
                className="text-gray-400 hover:text-gray-600 shrink-0 p-2 -m-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                title="Open on Upwork"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Action buttons - contextual by section */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {section === 'hot-leads' && (
              <>
                {hotLeadColumn && ADVANCE_MAP[hotLeadColumn] && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={handleAdvance}
                    disabled={loadingAction === 'advance'}
                  >
                    {loadingAction === 'advance' ? 'Moving...' : ADVANCE_MAP[hotLeadColumn]!.label}
                  </Button>
                )}
                {(hotLeadColumn === 'interview' || hotLeadColumn === 'hire') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={handleMarkCallDone}
                    disabled={loadingAction === 'call'}
                  >
                    {loadingAction === 'call' ? 'Saving...' : 'Mark Call Done'}
                  </Button>
                )}
                <CloseDealDropdown jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
              </>
            )}

            {section === 'awaiting-response' && (
              <LogResponseDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
            )}

            {section === 'follow-ups' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
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
                  className="text-gray-500 min-h-[44px]"
                >
                  {loadingAction === 'close' ? 'Closing...' : 'Close No Response'}
                </Button>
              </>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
