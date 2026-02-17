import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getJobsToApprove, getJobsBuilding } from '@/lib/queries/approve'
import { ApproveBoard } from '@/components/approve/approve-board'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'

async function ApproveContent() {
  'use cache'
  cacheTag('jobs-approve', 'jobs-building')
  cacheLife('dashboard')
  const [pendingJobs, buildingJobs] = await Promise.all([
    getJobsToApprove(),
    getJobsBuilding(),
  ])
  return <ApproveBoard pendingJobs={pendingJobs} buildingJobs={buildingJobs} />
}

export default function ApprovePage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Approve</h1>
          <PageInfoTooltip
            content="Jobs Ralph marked as buildable, waiting for your go-ahead. Approving kicks off a 45-minute prototype build. The Building column shows builds currently in progress."
            filter="Pending: Stage is 'Pending Approval' and Buildable is true. Building: Stage is 'Prototype Building'."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Review and approve briefs for prototype builds
        </p>
      </div>
      <Suspense>
        <ApproveContent />
      </Suspense>
    </div>
  )
}
