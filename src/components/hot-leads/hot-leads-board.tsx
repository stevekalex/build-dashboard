'use client'

import { useState, useEffect, useRef } from 'react'
import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { InboxCard, type HotLeadColumn } from '@/components/inbox/inbox-card'
import { ColumnTooltip } from '@/components/ui/column-tooltip'
import { useActionPolling } from '@/hooks/use-action-polling'
import { HotLeadColumns } from '@/lib/queries/inbox'

interface HotLeadsBoardProps {
  columns: HotLeadColumns
}

interface ColumnConfig {
  key: keyof HotLeadColumns
  title: string
  emoji: string
  tooltip: string
  jobs: Job[]
}

export function HotLeadsBoard({ columns }: HotLeadsBoardProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Build a fingerprint of all job IDs from server props.
  // When this changes (server revalidated), clear dismissed IDs.
  const allIds = [
    ...columns.shortlist,
    ...columns.interview,
    ...columns.hire,
  ].map((j) => j.id).sort().join(',')

  const startPolling = useActionPolling(allIds)

  const prevIds = useRef(allIds)
  let activeDismissedIds = dismissedIds
  if (prevIds.current !== allIds) {
    activeDismissedIds = new Set()
    prevIds.current = allIds
  }

  useEffect(() => {
    if (activeDismissedIds !== dismissedIds) {
      setDismissedIds(activeDismissedIds)
    }
  }, [activeDismissedIds, dismissedIds])

  function handleDismiss(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id))
    startPolling()
  }

  const columnConfigs: ColumnConfig[] = [
    { key: 'shortlist', title: 'Shortlist', emoji: '📋', tooltip: 'Client shortlisted your proposal', jobs: columns.shortlist },
    { key: 'interview', title: 'Interview', emoji: '🎙️', tooltip: 'Client invited you to interview', jobs: columns.interview },
    { key: 'hire', title: 'Hire', emoji: '🤝', tooltip: 'Client sent a hire offer', jobs: columns.hire },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columnConfigs.map((col) => {
        const visibleJobs = col.jobs.filter((j) => !activeDismissedIds.has(j.id))
        return (
          <div key={col.key} className="min-w-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span>{col.emoji}</span>
              <h2 className="font-semibold text-sm text-gray-700">{col.title}</h2>
              <Badge variant="secondary" className="text-xs">
                {visibleJobs.length}
              </Badge>
              <ColumnTooltip content={col.tooltip} />
            </div>
            <div className="space-y-2">
              {visibleJobs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No leads
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <InboxCard key={job.id} job={job} section="hot-leads" hotLeadColumn={col.key as HotLeadColumn} onAction={handleDismiss} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
