'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Job } from '@/types/brief'
import { markContractSent, markLost } from '@/app/actions/closing'
import { markCallDone, markContractSigned } from '@/app/actions/inbox'
import { MarkLostDialog } from './mark-lost-dialog'
import { CloseWonDialog } from './close-won-dialog'
import { getAirtableRecordUrl } from '@/lib/utils'

export type DealColumn = 'engaged' | 'callDone' | 'contractSent' | 'won'

interface DealCardProps {
  job: Job
  column: DealColumn
  onAction?: (jobId: string) => void
}

function formatAge(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
}

function formatBudget(amount?: number, type?: string): string {
  if (!amount) return ''
  const formatted = `$${amount.toLocaleString()}`
  if (type) return `${formatted} (${type})`
  return formatted
}

function formatDealValue(value?: number): string {
  if (!value) return ''
  return `$${value.toLocaleString()}`
}

export function DealCard({ job, column, onAction }: DealCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

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

  async function handleSendContract() {
    setLoadingAction('contract')
    onAction?.(job.id)
    try {
      await markContractSent(job.id)
    } catch (error) {
      console.error('Failed to mark contract sent:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const budget = formatBudget(job.budgetAmount, job.budgetType)
  const dealValueDisplay = formatDealValue(job.dealValue)
  const daysInStage = formatAge(job.scrapedAt)
  const airtableUrl = getAirtableRecordUrl(job.id)

  return (
    <Card className="py-3 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => airtableUrl && window.open(airtableUrl, '_blank')}>
      <CardContent className="px-4 py-0">
        <div className="flex flex-col gap-2">
          {/* Top row: Title + metadata */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {job.responseType && (
                  <Badge variant="outline" className="text-xs">
                    {job.responseType}
                  </Badge>
                )}
                {dealValueDisplay && (
                  <Badge variant="default" className="text-xs">
                    {dealValueDisplay}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {job.client && <span>{job.client}</span>}
                {budget && <span>{budget}</span>}
                {daysInStage && <span>{daysInStage}</span>}
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

          {/* Action buttons - contextual by column */}
          {column !== 'won' && (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
            <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {column === 'engaged' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={handleMarkCallDone}
                    disabled={loadingAction === 'call'}
                  >
                    {loadingAction === 'call' ? 'Saving...' : 'Mark Call Done'}
                  </Button>
                  <MarkLostDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
                </>
              )}

              {column === 'callDone' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={handleSendContract}
                    disabled={loadingAction === 'contract'}
                  >
                    {loadingAction === 'contract' ? 'Saving...' : 'Send Contract'}
                  </Button>
                  <MarkLostDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
                </>
              )}

              {column === 'contractSent' && (
                <>
                  <CloseWonDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
                  <MarkLostDialog jobId={job.id} jobTitle={job.title} onAction={() => onAction?.(job.id)} />
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
