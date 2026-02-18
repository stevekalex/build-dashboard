import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getFollowUps, groupFollowUpsByStage } from '@/lib/queries/inbox'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { FollowUpsBoard } from '@/components/follow-ups/follow-ups-board'

async function FollowUpsContent() {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  const followUps = await getFollowUps()
  const { overdue, upcoming } = groupFollowUpsByStage(followUps)

  return <FollowUpsBoard overdue={overdue} upcoming={upcoming} />
}

export default function FollowUpsPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Follow Ups</h1>
          <PageInfoTooltip
            content="Kanban board of jobs needing follow-up messages, split by urgency. Overdue jobs show first, upcoming jobs are collapsible."
            filter="Stage is a follow-up stage (Initial Message Sent, Touchpoint 1/2/3) and no response has been received yet."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Follow-up sequence board — overdue first, then upcoming
        </p>
      </div>
      <Suspense>
        <FollowUpsContent />
      </Suspense>
    </div>
  )
}
