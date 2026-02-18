'use client'

import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { ColumnTooltip } from '@/components/ui/column-tooltip'
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
  const columns: ColumnConfig[] = [
    { key: 'engaged', title: 'Engaged', emoji: '🤝', tooltip: 'Client showed engagement (Light or Prototype). No call done yet.', jobs: engaged },
    { key: 'callDone', title: 'Call Done', emoji: '📞', tooltip: 'Call completed. No contract sent yet.', jobs: callDone },
    { key: 'contractSent', title: 'Contract Sent', emoji: '📄', tooltip: 'Contract sent. Awaiting signature.', jobs: contractSent },
    { key: 'won', title: 'Won', emoji: '🏆', tooltip: 'Deal closed as won.', jobs: won },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="min-w-0">
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span>{col.emoji}</span>
            <h2 className="font-semibold text-sm text-gray-700">{col.title}</h2>
            <Badge variant="secondary" className="text-xs">
              {col.jobs.length}
            </Badge>
            <ColumnTooltip content={col.tooltip} />
          </div>

          {/* Column cards */}
          <div className="space-y-2">
            {col.jobs.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No deals
              </div>
            ) : (
              col.jobs.map((job) => (
                <DealCard key={job.id} job={job} column={col.key} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
