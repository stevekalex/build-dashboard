import { notFound } from 'next/navigation'
import { getBriefById } from '@/lib/airtable'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BriefActions } from '@/components/briefs/brief-actions'

interface BriefDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BriefDetailPage({ params }: BriefDetailPageProps) {
  const { id } = await params
  const brief = await getBriefById(id)

  if (!brief) {
    notFound()
  }

  // Parse the brief to extract structured data
  const parsedBrief = parseBriefData(brief.brief)

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Briefs</span>
          </Link>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-tight">{brief.title}</h1>
          <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-40 md:pb-24">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
            Description
          </h3>
          <p className="text-gray-900 leading-relaxed text-sm">{brief.description}</p>
        </div>

        {/* Done Criteria - MOVED TO TOP */}
        {parsedBrief.done_criteria && parsedBrief.done_criteria.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                Done Criteria ({parsedBrief.done_criteria.length})
              </span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ul className="space-y-3">
                {parsedBrief.done_criteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-900 leading-relaxed text-sm">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Routes - MOVED TO BOTTOM */}
        {parsedBrief.routes && parsedBrief.routes.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                Routes ({parsedBrief.routes.length})
              </span>
            </h3>
            <div className="space-y-3">
              {parsedBrief.routes.map((route, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-900 text-xs uppercase">
                        {route.type || 'Page'}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-purple-700 font-semibold break-all">
                      {route.path}
                    </div>
                    {route.title && <div className="text-sm text-gray-700">{route.title}</div>}
                    {route.entity && (
                      <div className="text-xs text-gray-500">Entity: {route.entity}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw JSON (collapsible) */}
        {brief.brief && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700 uppercase tracking-wide hover:text-blue-600 transition-colors bg-white rounded-lg p-4 border border-gray-200">
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

      {/* Fixed Bottom Action Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden shadow-lg z-20 safe-area-inset-bottom">
        <BriefActions brief={brief} />
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:block fixed bottom-8 right-8 z-20">
        <BriefActions brief={brief} />
      </div>
    </div>
  )
}

interface ParsedBrief {
  template?: string
  routes?: any[]
  done_criteria?: string[]
  [key: string]: any
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
