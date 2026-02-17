'use client'

import { Job } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { ApproveList } from './approve-list'
import { BuildingList } from './building-list'

interface ApproveBoardProps {
  pendingJobs: Job[]
  buildingJobs: Job[]
}

export function ApproveBoard({ pendingJobs, buildingJobs }: ApproveBoardProps) {
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
        <ApproveList jobs={pendingJobs} />
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
