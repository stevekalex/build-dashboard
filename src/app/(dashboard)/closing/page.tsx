import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getActiveDeals, groupDealsByStatus } from '@/lib/queries/closing'
import { ClosingBoard } from '@/components/closing/closing-board'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'

async function ClosingContent() {
  'use cache'
  cacheTag('jobs-closing')
  cacheLife('dashboard')
  const deals = await getActiveDeals()
  const grouped = groupDealsByStatus(deals)
  return <ClosingBoard {...grouped} />
}

export default function ClosingPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Closing Dashboard</h1>
          <PageInfoTooltip
            content="Tracks deals from first engagement through to contract signing. Columns show each deal's progress."
            filter="Stage is 'Light Engagement' or 'Engagement with prototype', grouped by Call Completed Date, Contract Sent Date, and Close Date."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">Active deals in progress</p>
      </div>
      <Suspense>
        <ClosingContent />
      </Suspense>
    </div>
  )
}
