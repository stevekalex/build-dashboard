import { DailyMetrics } from '@/types/brief'
import { MetricCard } from './metric-card'
import {
  Search,
  CheckCircle,
  Package,
  Send,
  MessageSquare,
  Phone,
  FileText,
} from 'lucide-react'

interface DailyMetricsViewProps {
  metrics: DailyMetrics
}

const metricConfig = [
  {
    key: 'jobsDetected' as const,
    label: 'Jobs Detected',
    icon: Search,
    colorClass: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  {
    key: 'jobsApproved' as const,
    label: 'Jobs Approved',
    icon: CheckCircle,
    colorClass: 'border-green-200 bg-green-50 text-green-900',
  },
  {
    key: 'prototypesBuilt' as const,
    label: 'Prototypes Built',
    icon: Package,
    colorClass: 'border-purple-200 bg-purple-50 text-purple-900',
  },
  {
    key: 'applicationsSent' as const,
    label: 'Applications Sent',
    icon: Send,
    colorClass: 'border-orange-200 bg-orange-50 text-orange-900',
  },
  {
    key: 'responsesReceived' as const,
    label: 'Responses Received',
    icon: MessageSquare,
    colorClass: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  },
  {
    key: 'callsCompleted' as const,
    label: 'Calls Completed',
    icon: Phone,
    colorClass: 'border-pink-200 bg-pink-50 text-pink-900',
  },
  {
    key: 'contractsSigned' as const,
    label: 'Contracts Signed',
    icon: FileText,
    colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
]

export function DailyMetricsView({ metrics }: DailyMetricsViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {metricConfig.map((config) => (
        <MetricCard
          key={config.key}
          label={config.label}
          value={metrics[config.key]}
          icon={config.icon}
          colorClass={config.colorClass}
        />
      ))}
    </div>
  )
}
