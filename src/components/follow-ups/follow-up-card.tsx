'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Job } from '@/types/brief'
import { DueTimeBadge } from '@/components/inbox/due-time-badge'
import { GenerateMessageDialog } from './generate-message-dialog'
import { markFollowedUp, closeNoResponse } from '@/app/actions/inbox'
import { getAirtableRecordUrl } from '@/lib/utils'

export type FollowUpColumn = 'followUp1' | 'followUp2' | 'followUp3'

interface FollowUpCardProps {
  job: Job
  column: FollowUpColumn
  onDismiss: (jobId: string) => void
}

function formatBudget(amount?: number, type?: string): string {
  if (!amount) return ''
  const formatted = `$${amount.toLocaleString()}`
  if (type) return `${formatted} (${type})`
  return formatted
}

export function FollowUpCard({ job, column, onDismiss }: FollowUpCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const budget = formatBudget(job.budgetAmount, job.budgetType)
  const airtableUrl = getAirtableRecordUrl(job.id)
  async function handleCloseNoResponse() {
    setLoadingAction('close')
    onDismiss(job.id)
    try {
      await closeNoResponse(job.id)
    } catch (error) {
      console.error('Failed to close no response:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleMarkSent() {
    setLoadingAction('sent')
    onDismiss(job.id)
    try {
      await markFollowedUp(job.id)
    } catch (error) {
      console.error('Failed to mark as sent:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Card
      className="py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
      onClick={() => airtableUrl && window.open(airtableUrl, '_blank')}
    >
      <CardContent className="px-4 py-0">
        <div className="flex flex-col gap-2">
          {/* Top row: Title + DueTimeBadge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <DueTimeBadge nextActionDate={job.nextActionDate} />
                <Badge variant="outline" className="text-[10px]">
                  {job.stage}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {job.client && <span>{job.client}</span>}
                {budget && <span>{budget}</span>}
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

          {/* Action buttons */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={handleMarkSent}
              disabled={loadingAction === 'sent'}
            >
              {loadingAction === 'sent' ? 'Saving...' : 'Mark Sent'}
            </Button>
            <GenerateMessageDialog
              jobId={job.id}
              stage={job.stage}
              onSent={() => onDismiss(job.id)}
              onMarkSent={handleMarkSent}
            />
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-gray-500"
              onClick={handleCloseNoResponse}
              disabled={loadingAction === 'close'}
            >
              {loadingAction === 'close' ? 'Closing...' : 'Close No Response'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
