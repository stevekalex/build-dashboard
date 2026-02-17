import { Suspense } from 'react'
import { getHotLeads, getAwaitingResponse, getFollowUpsDue } from '@/lib/queries/inbox'
import { InboxView } from '@/components/inbox/inbox-view'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'

async function InboxContent() {
  'use cache'
  const [hotLeads, awaitingResponse, followUpsDue] = await Promise.all([
    getHotLeads(),
    getAwaitingResponse(),
    getFollowUpsDue(),
  ])

  return (
    <InboxView
      hotLeads={hotLeads}
      awaitingResponse={awaitingResponse}
      followUpsDue={followUpsDue}
    />
  )
}

export default function InboxPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Inbox</h1>
          <PageInfoTooltip
            content="Your daily Upwork command center. Shows hot leads, due follow-ups, and jobs waiting for a response."
            filter="Jobs Pipeline where Applied At, Response Type, Response Date, or Next Action Date match each section's criteria."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Your daily Upwork overview
        </p>
      </div>
      <Suspense>
        <InboxContent />
      </Suspense>
    </div>
  )
}
