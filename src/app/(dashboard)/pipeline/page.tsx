import { getPipelineCounts } from '@/lib/queries/pipeline'
import { PipelineFunnel } from '@/components/pipeline/pipeline-funnel'

export const revalidate = 60

export default async function PipelinePage() {
  const counts = await getPipelineCounts()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-3xl font-bold text-gray-900">Pipeline Overview</h1>
        <p className="text-xs md:text-base text-gray-600 mt-1">Jobs across all stages</p>
      </div>
      <PipelineFunnel counts={counts} />
    </div>
  )
}
