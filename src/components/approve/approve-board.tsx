'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'
import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { ApproveList } from './approve-list'
import { BuildingList } from './building-list'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 10 // 30 seconds max

interface ApproveBoardProps {
  pendingJobs: Job[]
  buildingJobs: Job[]
}

export function ApproveBoard({ pendingJobs, buildingJobs }: ApproveBoardProps) {
  const router = useRouter()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevBuildingIdsRef = useRef(new Set(buildingJobs.map((j) => j.id)))

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    let count = 0
    pollingRef.current = setInterval(() => {
      count++
      router.refresh()
      if (count >= MAX_POLLS) stopPolling()
    }, POLL_INTERVAL_MS)
  }, [router, stopPolling])

  // Stop polling early when a new job appears in the Building column
  useEffect(() => {
    const currentIds = new Set(buildingJobs.map((j) => j.id))
    const prevIds = prevBuildingIdsRef.current
    const hasNewJob = [...currentIds].some((id) => !prevIds.has(id))

    if (hasNewJob && pollingRef.current) {
      stopPolling()
    }

    prevBuildingIdsRef.current = currentIds
  }, [buildingJobs, stopPolling])

  // Clean up on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pending Approval column */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span>⏸️</span>
          <h2 className="font-semibold text-sm text-gray-700">Pending Approval</h2>
          <Badge variant="secondary" className="text-xs">
            {pendingJobs.length}
          </Badge>
        </div>
        <ApproveList jobs={pendingJobs} onAction={startPolling} />
      </div>

      {/* Building column */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span>🔨</span>
          <h2 className="font-semibold text-sm text-gray-700">Building</h2>
          <Badge variant="secondary" className="text-xs">
            {buildingJobs.length}
          </Badge>
        </div>
        <BuildingList jobs={buildingJobs} />
      </div>
    </div>
  )
}
