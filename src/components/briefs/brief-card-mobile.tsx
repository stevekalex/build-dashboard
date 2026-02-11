'use client'

import Link from 'next/link'
import { Brief } from '@/types/brief'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react'

interface BriefCardMobileProps {
  brief: Brief
  onApprove: (briefId: string) => Promise<void>
  onReject: (briefId: string, reason: string) => Promise<void>
}

export function BriefCardMobile({ brief }: BriefCardMobileProps) {
  return (
    <Link href={`/briefs/${brief.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 active:bg-gray-50 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
              {brief.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge
                variant={brief.buildable ? 'default' : 'destructive'}
                className="text-xs"
              >
                {brief.buildable ? '✅ Buildable' : '❌ Not Buildable'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatTemplate(brief.template)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatStatus(brief.status)}
              </Badge>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {brief.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3">
            {brief.routes && brief.routes.length > 0 && (
              <span className="font-medium">
                <span className="text-purple-700">{brief.routes.length}</span> routes
              </span>
            )}
          </div>
          <span>{formatDistanceToNow(new Date(brief.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  )
}

function formatTemplate(template: string): string {
  const templateMap: Record<string, string> = {
    dashboard: 'Dashboard',
    web_app: 'Web App',
    unknown: 'Unknown',
  }
  return templateMap[template] || template
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '⏸️ Pending',
    approved: '✅ Approved',
    building: '🔨 Building',
    complete: '✅ Complete',
    failed: '❌ Failed',
  }
  return statusMap[status] || status
}
