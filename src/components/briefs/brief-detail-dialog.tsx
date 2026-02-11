'use client'

import { Brief } from '@/types/brief'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface BriefDetailDialogProps {
  brief: Brief
  children: React.ReactNode
}

interface ParsedBrief {
  template?: string
  routes?: any[]
  done_criteria?: string[]
  [key: string]: any
}

export function BriefDetailDialog({ brief, children }: BriefDetailDialogProps) {
  const [open, setOpen] = useState(false)

  // Parse the brief to extract structured data
  const parsedBrief = parseBriefData(brief.brief)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="!w-[80vw] sm:!max-w-[80vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold pr-8">{brief.title}</DialogTitle>
          <DialogDescription className="flex gap-2 items-center pt-2 flex-wrap">
            <Badge variant={brief.buildable ? 'default' : 'destructive'} className="text-sm">
              {brief.buildable ? '✅ Buildable' : '❌ Not Buildable'}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {formatTemplate(brief.template)}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {formatStatus(brief.status)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">
              Description
            </h3>
            <p className="text-gray-900 leading-relaxed">{brief.description}</p>
          </div>

          {/* Routes */}
          {parsedBrief.routes && parsedBrief.routes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Routes ({parsedBrief.routes.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsedBrief.routes.map((route, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-900 text-xs uppercase">
                          {route.type || 'Page'}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-purple-700 font-semibold break-all">
                        {route.path}
                      </div>
                      {route.title && (
                        <div className="text-sm text-gray-700">{route.title}</div>
                      )}
                      {route.entity && (
                        <div className="text-xs text-gray-500">Entity: {route.entity}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done Criteria */}
          {parsedBrief.done_criteria && parsedBrief.done_criteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  Done Criteria ({parsedBrief.done_criteria.length})
                </span>
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="space-y-3">
                  {parsedBrief.done_criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-900 leading-relaxed">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Raw JSON (collapsible) */}
          {brief.brief && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 uppercase tracking-wide hover:text-blue-600 transition-colors">
                View Raw Brief JSON
              </summary>
              <div className="mt-3">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                  {formatBriefJson(brief.brief)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function parseBriefData(briefString: string): ParsedBrief {
  try {
    return JSON.parse(briefString)
  } catch {
    return {}
  }
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

function formatBriefJson(briefData: string): string {
  try {
    const parsed = JSON.parse(briefData)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return briefData
  }
}
