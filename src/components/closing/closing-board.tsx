'use client'

import { useState, useEffect, useRef } from 'react'
import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { ColumnTooltip } from '@/components/ui/column-tooltip'
import { useActionPolling } from '@/hooks/use-action-polling'
import { DealCard, DealColumn } from './deal-card'

interface ClosingBoardProps {
  engaged: Job[]
  callDone: Job[]
  contractSent: Job[]
  won: Job[]
}

interface ColumnConfig {
  key: DealColumn
  title: string
  emoji: string
  tooltip: string
  jobs: Job[]
}

export function ClosingBoard({
  engaged,
  callDone,
  contractSent,
  won,
}: ClosingBoardProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const allJobs = [...engaged, ...callDone, ...contractSent, ...won]
  const fingerprint = allJobs.map((j) => j.id).sort().join(',')
  const startPolling = useActionPolling(fingerprint)

  // Clear dismissed IDs when server data changes
  const prevFingerprint = useRef(fingerprint)
  let activeDismissedIds = dismissedIds
  if (prevFingerprint.current !== fingerprint) {
    activeDismissedIds = new Set()
    prevFingerprint.current = fingerprint
  }

  useEffect(() => {
    if (activeDismissedIds !== dismissedIds) {
      setDismissedIds(activeDismissedIds)
    }
  }, [activeDismissedIds, dismissedIds])

  function handleAction(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id))
    startPolling()
  }

  const columns: ColumnConfig[] = [
    { key: 'engaged', title: 'Engaged', emoji: '🤝', tooltip: 'Stage = "🧐 Light Engagement" or "🕺 Engagement with prototype", no Call Completed Date or Contract Sent Date', jobs: engaged },
    { key: 'callDone', title: 'Call Done', emoji: '📞', tooltip: 'Call Completed Date is set, Contract Sent Date is empty', jobs: callDone },
    { key: 'contractSent', title: 'Contract Sent', emoji: '📄', tooltip: 'Contract Sent Date is set', jobs: contractSent },
    { key: 'won', title: 'Won', emoji: '🏆', tooltip: 'Stage = "🏁 Closed Won"', jobs: won },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const visibleJobs = col.jobs.filter((j) => !activeDismissedIds.has(j.id))
        return (
          <div key={col.key} className="min-w-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span>{col.emoji}</span>
              <h2 className="font-semibold text-sm text-gray-700">{col.title}</h2>
              <Badge variant="secondary" className="text-xs">
                {visibleJobs.length}
              </Badge>
              <ColumnTooltip content={col.tooltip} />
            </div>

            {/* Column cards */}
            <div className="space-y-2">
              {visibleJobs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No deals
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <DealCard key={job.id} job={job} column={col.key} onAction={handleAction} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
