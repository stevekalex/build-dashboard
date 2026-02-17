import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  icon: LucideIcon
  colorClass: string
}

export function MetricCard({ label, value, icon: Icon, colorClass }: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', colorClass)}>
      <CardContent className="flex flex-col items-center gap-2 py-4 px-4">
        <div className="flex items-center justify-between w-full">
          <Icon className="h-5 w-5 opacity-70" />
        </div>
        <div className="text-3xl md:text-4xl font-bold tracking-tight">{value}</div>
        <div className="text-xs md:text-sm font-medium opacity-80">{label}</div>
      </CardContent>
    </Card>
  )
}
