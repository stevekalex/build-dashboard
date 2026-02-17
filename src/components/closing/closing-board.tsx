'use client'

import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
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
  jobs: Job[]
}

export function ClosingBoard({
  engaged,
  callDone,
  contractSent,
  won,
}: ClosingBoardProps) {
  const columns: ColumnConfig[] = [
    { key: 'engaged', title: 'Engaged', emoji: '🤝', jobs: engaged },
    { key: 'callDone', title: 'Call Done', emoji: '📞', jobs: callDone },
    { key: 'contractSent', title: 'Contract Sent', emoji: '📄', jobs: contractSent },
    { key: 'won', title: 'Won', emoji: '🏆', jobs: won },
  ]

  const totalDeals = engaged.length + callDone.length + contractSent.length + won.length

  if (totalDeals === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No active deals</p>
        <p className="text-sm mt-1">Deals in engagement stages will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
      {columns.map((col) => (
        <div key={col.key} className="min-w-[280px]">
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span>{col.emoji}</span>
            <h2 className="font-semibold text-sm text-gray-700">{col.title}</h2>
            <Badge variant="secondary" className="text-xs">
              {col.jobs.length}
            </Badge>
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
