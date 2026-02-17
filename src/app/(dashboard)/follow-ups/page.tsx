import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getFollowUps } from '@/lib/queries/inbox'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { InboxSectionPage } from '@/components/inbox/inbox-section-page'

async function FollowUpsContent() {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  const followUps = await getFollowUps()

  return (
    <InboxSectionPage
      jobs={followUps}
      section="follow-ups"
      emoji="📆"
      title="Follow Ups"
      description="All jobs that need a follow-up message. Sorted by next action date."
      filter="Stage is a follow-up stage and no response has been received yet."
      emptyMessage="No follow-ups right now"
    />
  )
}

export default function FollowUpsPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Follow Ups</h1>
          <PageInfoTooltip
            content="All jobs that need a follow-up message. Sorted by next action date."
            filter="Stage is a follow-up stage (Initial Message Sent, Touchpoint 1/2/3) and no response has been received yet."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Jobs waiting for a follow-up message
        </p>
      </div>
      <Suspense>
        <FollowUpsContent />
      </Suspense>
    </div>
  )
}
