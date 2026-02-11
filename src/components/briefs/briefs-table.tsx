'use client'

import Link from 'next/link'
import { Brief } from '@/types/brief'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { ApproveDialog } from './approve-dialog'
import { RejectDialog } from './reject-dialog'
import { BriefDetailDialog } from './brief-detail-dialog'
import { approveBrief, rejectBriefAction } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { InfoIcon } from 'lucide-react'

interface BriefsTableProps {
  briefs: Brief[]
}

export function BriefsTable({ briefs }: BriefsTableProps) {
  const router = useRouter()

  async function handleApprove(briefId: string) {
    const result = await approveBrief(briefId)
    if (result.success) {
      router.refresh()
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  async function handleReject(briefId: string, reason: string) {
    const result = await rejectBriefAction(briefId, reason)
    if (result.success) {
      router.refresh()
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  if (briefs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="space-y-2">
          <p className="text-lg font-medium">No briefs pending approval</p>
          <p className="text-sm text-gray-400">New jobs will appear here when submitted</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <TableHead className="font-semibold text-gray-900">Job Title</TableHead>
            <TableHead className="font-semibold text-gray-900">Description</TableHead>
            <TableHead className="font-semibold text-gray-900">Template</TableHead>
            <TableHead className="font-semibold text-gray-900">Buildable</TableHead>
            <TableHead className="font-semibold text-gray-900">Routes</TableHead>
            <TableHead className="font-semibold text-gray-900">Created</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {briefs.map((brief, index) => (
            <TableRow
              key={brief.id}
              className="hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100 group"
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 0.4s ease-out forwards',
                opacity: 0,
              }}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/briefs/${brief.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                >
                  {brief.title}
                </Link>
              </TableCell>

              <TableCell className="max-w-md">
                <BriefDetailDialog brief={brief}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-left hover:text-blue-700 transition-colors cursor-pointer group/desc w-full">
                        <div className="line-clamp-2 group-hover/desc:text-blue-600 whitespace-normal break-words">
                          {brief.description}
                        </div>
                        {brief.description.length > 100 && (
                          <span className="text-blue-500 text-xs opacity-0 group-hover/desc:opacity-100 transition-opacity block mt-1">
                            Click to expand
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      <p className="text-sm whitespace-normal break-words">{brief.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </BriefDetailDialog>
              </TableCell>

              <TableCell>
                <Badge
                  variant="secondary"
                  className="font-medium transition-all hover:scale-105"
                >
                  {formatTemplate(brief.template)}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant={brief.buildable ? 'default' : 'destructive'}
                  className="font-medium transition-all hover:scale-105"
                >
                  {brief.buildable ? '✅ Buildable' : '❌ Not Buildable'}
                </Badge>
              </TableCell>

              <TableCell>
                {brief.routes && brief.routes.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors group/routes">
                        <span className="font-mono text-sm font-semibold">
                          {brief.routes.length}
                        </span>
                        <span className="text-xs text-gray-500 group-hover/routes:text-blue-500">
                          {brief.routes.length === 1 ? 'route' : 'routes'}
                        </span>
                        <InfoIcon className="w-3.5 h-3.5 opacity-50 group-hover/routes:opacity-100" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        {brief.routes.slice(0, 5).map((route, idx) => (
                          <div key={idx} className="font-mono text-xs text-blue-600">
                            {typeof route === 'string' ? route : JSON.stringify(route)}
                          </div>
                        ))}
                        {brief.routes.length > 5 && (
                          <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                            + {brief.routes.length - 5} more
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-gray-400 text-sm">No routes</span>
                )}
              </TableCell>

              <TableCell className="text-sm text-gray-500 font-medium">
                {formatDistanceToNow(new Date(brief.createdAt), { addSuffix: true })}
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className="font-medium transition-all hover:scale-105"
                >
                  {formatStatus(brief.status)}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ApproveDialog brief={brief} onApprove={handleApprove} />
                  <RejectDialog brief={brief} onReject={handleReject} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
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
