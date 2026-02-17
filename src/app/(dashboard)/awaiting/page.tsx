import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getAwaitingResponse } from '@/lib/queries/inbox'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { InboxSectionPage } from '@/components/inbox/inbox-section-page'

async function AwaitingContent() {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  const awaitingResponse = await getAwaitingResponse()

  return (
    <InboxSectionPage
      jobs={awaitingResponse}
      section="awaiting-response"
      emoji="📬"
      title="Awaiting Response"
      description="Jobs you applied to but haven't heard back yet. No action needed — just monitoring."
      filter="Applied At is set, but Response Date is empty."
      emptyMessage="No jobs awaiting response"
    />
  )
}

export default function AwaitingPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Awaiting Response</h1>
          <PageInfoTooltip
            content="Jobs you applied to but haven't heard back yet. No action needed — just monitoring."
            filter="Applied At is set, but Response Date is empty."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Applied jobs waiting for a client response
        </p>
      </div>
      <Suspense>
        <AwaitingContent />
      </Suspense>
    </div>
  )
}
