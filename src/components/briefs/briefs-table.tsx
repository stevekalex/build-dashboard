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
import { formatDistanceToNow } from 'date-fns'
import { ApproveDialog } from './approve-dialog'
import { RejectDialog } from './reject-dialog'
import { approveBrief, rejectBriefAction } from '@/app/actions'
import { useRouter } from 'next/navigation'

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
      <div className="text-center py-12 text-gray-500">
        <p>No briefs pending approval</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Buildable</TableHead>
            <TableHead>Routes</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {briefs.map((brief) => (
            <TableRow key={brief.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/briefs/${brief.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {brief.title}
                </Link>
              </TableCell>
              <TableCell className="max-w-md">
                {truncateText(brief.description, 100)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{formatTemplate(brief.template)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={brief.buildable ? 'default' : 'destructive'}>
                  {brief.buildable ? '✅ Buildable' : '❌ Not Buildable'}
                </Badge>
              </TableCell>
              <TableCell>
                {brief.routes?.length || 0} {brief.routes?.length === 1 ? 'route' : 'routes'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(brief.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{formatStatus(brief.status)}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <ApproveDialog brief={brief} onApprove={handleApprove} />
                  <RejectDialog brief={brief} onReject={handleReject} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
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
