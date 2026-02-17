import { PipelineCounts } from '@/types/brief'
import { Card, CardContent } from '@/components/ui/card'
import { StageCard } from './stage-card'

interface PipelineFunnelProps {
  counts: PipelineCounts
}

interface StageConfig {
  key: keyof PipelineCounts
  label: string
  testId: string
}

interface StageGroup {
  title: string
  color: string
  stages: StageConfig[]
}

const STAGE_GROUPS: StageGroup[] = [
  {
    title: 'Inbound',
    color: 'bg-blue-500',
    stages: [
      { key: 'new', label: 'New', testId: 'new' },
      { key: 'pendingApproval', label: 'Pending Approval', testId: 'pendingApproval' },
      { key: 'approved', label: 'Approved', testId: 'approved' },
    ],
  },
  {
    title: 'Building',
    color: 'bg-purple-500',
    stages: [
      { key: 'building', label: 'Building', testId: 'building' },
      { key: 'deployed', label: 'Deployed', testId: 'deployed' },
      { key: 'buildFailed', label: 'Build Failed', testId: 'buildFailed' },
    ],
  },
  {
    title: 'Outreach',
    color: 'bg-orange-500',
    stages: [
      { key: 'applied', label: 'Applied', testId: 'applied' },
      { key: 'followUps', label: 'Follow-ups', testId: 'followUps' },
    ],
  },
  {
    title: 'Closing',
    color: 'bg-green-500',
    stages: [
      { key: 'engaging', label: 'Engaging', testId: 'engaging' },
      { key: 'closedWon', label: 'Won', testId: 'closedWon' },
      { key: 'closedLost', label: 'Lost', testId: 'closedLost' },
      { key: 'rejected', label: 'Rejected', testId: 'rejected' },
    ],
  },
]

/**
 * Pipeline funnel visualization showing job counts at each stage.
 * Server component -- purely presentational.
 */
export function PipelineFunnel({ counts }: PipelineFunnelProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const maxCount = Math.max(...Object.values(counts))

  return (
    <div className="space-y-6">
      {/* Total summary */}
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500 mt-1">Total Jobs in Pipeline</p>
          </div>
        </CardContent>
      </Card>

      {/* Stage groups */}
      {STAGE_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardContent className="space-y-3 pt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.stages.map((stage) => (
                <StageCard
                  key={stage.key}
                  label={stage.label}
                  count={counts[stage.key]}
                  maxCount={maxCount}
                  color={group.color}
                  testId={stage.testId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
