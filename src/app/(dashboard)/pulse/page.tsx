import { Suspense } from 'react'
import { cacheTag, cacheLife } from 'next/cache'
import { getDailyMetrics } from '@/lib/queries/metrics'
import { DailyMetricsView } from '@/components/pulse/daily-metrics'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'
import { TodayDate } from '@/components/pulse/today-date'

async function PulseContent() {
  'use cache'
  cacheTag('jobs-metrics')
  cacheLife('analytics')
  const metrics = await getDailyMetrics()
  return <DailyMetricsView metrics={metrics} />
}

export default function PulsePage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Daily Pulse</h1>
          <PageInfoTooltip
            content="A snapshot of today's activity across the entire pipeline."
            filter="Each metric counts jobs where a date field matches today: Scraped At, Approved Date, Deployed Date, Applied At, Response Date, Call Completed Date, or Close Date."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Today&apos;s activity at a glance &mdash;{' '}
          <Suspense>
            <TodayDate />
          </Suspense>
        </p>
      </div>
      <Suspense>
        <PulseContent />
      </Suspense>
    </div>
  )
}
