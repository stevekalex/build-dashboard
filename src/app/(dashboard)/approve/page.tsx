import { Suspense } from 'react'
import { getJobsToApprove } from '@/lib/queries/approve'
import { ApproveList } from '@/components/approve/approve-list'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'

async function ApproveContent() {
  'use cache'
  const jobs = await getJobsToApprove()
  return <ApproveList jobs={jobs} />
}

export default function ApprovePage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Approve</h1>
          <PageInfoTooltip
            content="Jobs Ralph marked as buildable, waiting for your go-ahead. Approving kicks off a 45-minute prototype build."
            filter="Stage is 'Pending Approval' and Build Details → Buildable is true."
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
