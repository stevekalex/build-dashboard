import { getDailyMetrics } from '@/lib/queries/metrics'
import { DailyMetricsView } from '@/components/pulse/daily-metrics'

export const revalidate = 60 // refresh every 60 seconds

export default async function PulsePage() {
  const metrics = await getDailyMetrics()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">Daily Pulse</h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">
          Today&apos;s activity at a glance &mdash;{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      <DailyMetricsView metrics={metrics} />
    </div>
  )
}
