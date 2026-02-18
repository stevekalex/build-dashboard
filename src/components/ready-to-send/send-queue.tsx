'use client'

import { useState, useRef, useEffect } from 'react'
import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { SendCard } from './send-card'

interface SendQueueProps {
  jobs: Job[]
}

export function SendQueue({ jobs }: SendQueueProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Clear dismissed IDs when server data changes (job actually removed)
  const allIds = jobs.map((j) => j.id).sort().join(',')
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

  const visibleJobs = jobs.filter((j) => !activeDismissedIds.has(j.id))

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
          {visibleJobs.length} {visibleJobs.length === 1 ? 'job' : 'jobs'} ready
        </Badge>
      </div>
      <div className="space-y-4">
        {visibleJobs.map((job) => (
          <SendCard key={job.id} job={job} onDismiss={(id) => setDismissedIds((prev) => new Set(prev).add(id))} />
        ))}
      </div>
    </div>
  )
}
