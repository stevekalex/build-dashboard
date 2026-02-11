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

interface BriefDetailDialogProps {
  brief: Brief
  children: React.ReactNode
}

export function BriefDetailDialog({ brief, children }: BriefDetailDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{brief.title}</DialogTitle>
          <DialogDescription className="flex gap-2 items-center pt-2">
            <Badge variant={brief.buildable ? 'default' : 'destructive'}>
              {brief.buildable ? '✅ Buildable' : '❌ Not Buildable'}
            </Badge>
            <Badge variant="secondary">{formatTemplate(brief.template)}</Badge>
            <Badge variant="outline">{formatStatus(brief.status)}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Description
            </h3>
            <p className="text-gray-900 leading-relaxed">{brief.description}</p>
          </div>

          {brief.routes && brief.routes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Routes ({brief.routes.length})
              </h3>
              <div className="space-y-2">
                {brief.routes.map((route, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="font-mono text-sm text-blue-600">
                      {typeof route === 'string' ? route : JSON.stringify(route)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brief.uniqueInteractions && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Unique Interactions
              </h3>
              <p className="text-gray-900 leading-relaxed">{brief.uniqueInteractions}</p>
            </div>
          )}

          {brief.brief && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Full Brief (JSON)
              </h3>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                {formatBriefJson(brief.brief)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

function formatBriefJson(briefData: string): string {
  try {
    // Try to parse and pretty-print JSON
    const parsed = JSON.parse(briefData)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If it's not JSON, return as-is
    return briefData
  }
}
