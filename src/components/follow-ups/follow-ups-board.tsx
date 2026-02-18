'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { FollowUpCard, FollowUpColumn } from './follow-up-card'
import { FollowUpColumns } from '@/lib/queries/inbox'

interface FollowUpsBoardProps {
  overdue: FollowUpColumns
  upcoming: FollowUpColumns
}

interface ColumnConfig {
  key: FollowUpColumn
  title: string
  emoji: string
  jobs: Job[]
}

function totalCount(columns: FollowUpColumns): number {
  return columns.followUp1.length + columns.followUp2.length + columns.followUp3.length + columns.closeOut.length
}

function buildColumns(columns: FollowUpColumns): ColumnConfig[] {
  return [
    { key: 'followUp1', title: 'Follow-up 1', emoji: '💌', jobs: columns.followUp1 },
    { key: 'followUp2', title: 'Follow-up 2', emoji: '📆', jobs: columns.followUp2 },
    { key: 'followUp3', title: 'Follow-up 3', emoji: '📆', jobs: columns.followUp3 },
    { key: 'closeOut', title: 'Close Out', emoji: '🚪', jobs: columns.closeOut },
  ]
}

function filterDismissed(columns: FollowUpColumns, dismissedIds: Set<string>): FollowUpColumns {
  const filter = (jobs: Job[]) => jobs.filter((j) => !dismissedIds.has(j.id))
  return {
    followUp1: filter(columns.followUp1),
    followUp2: filter(columns.followUp2),
    followUp3: filter(columns.followUp3),
    closeOut: filter(columns.closeOut),
  }
}

function KanbanGrid({
  columns,
  dismissedIds,
  onDismiss,
}: {
  columns: ColumnConfig[]
  dismissedIds: Set<string>
  onDismiss: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const visibleJobs = col.jobs.filter((j) => !dismissedIds.has(j.id))
        return (
          <div key={col.key} className="min-w-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span>{col.emoji}</span>
              <h3 className="font-semibold text-sm text-gray-700">{col.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {visibleJobs.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {visibleJobs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No jobs
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <FollowUpCard key={job.id} job={job} column={col.key} onDismiss={onDismiss} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FollowUpsBoard({ overdue, upcoming }: FollowUpsBoardProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [upcomingExpanded, setUpcomingExpanded] = useState(false)

  // Build a fingerprint of all job IDs from server props.
  // When this changes (server revalidated), clear dismissed IDs so
  // cards that moved columns reappear in their new position.
  const allIds = [
    ...overdue.followUp1, ...overdue.followUp2, ...overdue.followUp3, ...overdue.closeOut,
    ...upcoming.followUp1, ...upcoming.followUp2, ...upcoming.followUp3, ...upcoming.closeOut,
  ].map((j) => j.id).sort().join(',')

  const prevIds = useRef(allIds)
  useEffect(() => {
    if (prevIds.current !== allIds) {
      setDismissedIds(new Set())
      prevIds.current = allIds
    }
  }, [allIds])

  const filteredOverdue = filterDismissed(overdue, dismissedIds)
  const filteredUpcoming = filterDismissed(upcoming, dismissedIds)

  const overdueCount = totalCount(filteredOverdue)
  const upcomingCount = totalCount(filteredUpcoming)
  const total = overdueCount + upcomingCount

  function handleDismiss(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id))
  }

  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No follow-ups</p>
        <p className="text-sm mt-1">Jobs needing follow-up messages will appear here</p>
      </div>
    )
  }

  const overdueColumns = buildColumns(filteredOverdue)
  const upcomingColumns = buildColumns(filteredUpcoming)

  return (
    <div className="space-y-8">
      {/* Overdue board - always visible */}
      {overdueCount > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-base text-gray-900">Overdue</h2>
            <Badge variant="destructive" className="text-xs">
              {overdueCount}
            </Badge>
          </div>
          <KanbanGrid columns={overdueColumns} dismissedIds={dismissedIds} onDismiss={handleDismiss} />
        </div>
      )}

      {/* Upcoming board - collapsible, collapsed by default */}
      {upcomingCount > 0 && (
        <div data-section="upcoming">
          <button
            onClick={() => setUpcomingExpanded(!upcomingExpanded)}
            className="flex items-center gap-2 mb-4 hover:text-gray-700 transition-colors"
          >
            {upcomingExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <h2 className="font-semibold text-base text-gray-900">Upcoming</h2>
            <Badge variant="secondary" className="text-xs">
              {upcomingCount}
            </Badge>
          </button>
          {upcomingExpanded && (
            <KanbanGrid columns={upcomingColumns} dismissedIds={dismissedIds} onDismiss={handleDismiss} />
          )}
        </div>
      )}
    </div>
  )
}
