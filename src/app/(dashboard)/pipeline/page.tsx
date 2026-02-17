import { getPipelineCounts } from '@/lib/queries/pipeline'
import { PipelineFunnel } from '@/components/pipeline/pipeline-funnel'
import { PageInfoTooltip } from '@/components/ui/page-info-tooltip'


export default async function PipelinePage() {
  'use cache'
  const counts = await getPipelineCounts()
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-3xl font-bold text-gray-900">Pipeline Overview</h1>
          <PageInfoTooltip
            content="How many jobs are at each stage, from new leads through to closed deals."
            filter="All jobs in Jobs Pipeline, counted and grouped by the Stage field."
          />
        </div>
        <p className="text-xs md:text-base text-gray-600 mt-1">Jobs across all stages</p>
      </div>
      <PipelineFunnel counts={counts} />
    </div>
  )
}
