'use client'

import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { SendCard } from './send-card'

interface SendQueueProps {
  jobs: Job[]
}

export function SendQueue({ jobs }: SendQueueProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="space-y-2">
          <p className="text-4xl">🎉</p>
          <p className="text-lg font-medium">All caught up! No applications to send.</p>
          <p className="text-sm text-gray-400">
            New jobs will appear here when prototypes are ready
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} ready
        </Badge>
      </div>
      <div className="space-y-4">
        {jobs.map((job) => (
          <SendCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
