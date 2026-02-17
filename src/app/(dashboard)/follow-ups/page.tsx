import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getFollowUpsDue } from '@/lib/queries/inbox'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { InboxSectionPage } from '@/components/inbox/inbox-section-page'

async function FollowUpsContent() {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  const followUpsDue = await getFollowUpsDue()

  return (
    <InboxSectionPage
      jobs={followUpsDue}
      section="follow-ups-due"
      emoji="📆"
      title="Follow-ups Due"
      description="Follow-ups that are due today or overdue. Send a message to stay top of mind."
      filter="Next Action Date is today or earlier."
      emptyMessage="No follow-ups due today"
    />
  )
}

export default function FollowUpsPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Follow Ups Due</h1>
          <PageInfoTooltip
            content="Follow-ups that are due today or overdue. Send a message to stay top of mind."
            filter="Next Action Date is today or earlier."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Jobs that need a follow-up message today
        </p>
      </div>
      <Suspense>
        <FollowUpsContent />
      </Suspense>
    </div>
  )
}
