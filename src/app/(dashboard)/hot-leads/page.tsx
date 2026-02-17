import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getHotLeads } from '@/lib/queries/inbox'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { InboxSectionPage } from '@/components/inbox/inbox-section-page'

async function HotLeadsContent() {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  const hotLeads = await getHotLeads()

  return (
    <InboxSectionPage
      jobs={hotLeads}
      section="hot-leads"
      emoji="🔥"
      title="Hot Leads"
      description="Clients who responded positively. These are warm leads — act fast."
      filter="Response Type is Shortlist, Interview, or Hire, and deal is not closed."
      emptyMessage="No hot leads right now"
    />
  )
}

export default function HotLeadsPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Hot Leads</h1>
          <PageInfoTooltip
            content="Clients who responded positively. These are warm leads — act fast."
            filter="Response Type is Shortlist, Interview, or Hire, and deal is not closed."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Warm leads that need your attention
        </p>
      </div>
      <Suspense>
        <HotLeadsContent />
      </Suspense>
    </div>
  )
}
