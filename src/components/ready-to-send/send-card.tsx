'use client'

import { useState } from 'react'
import { Job } from '@/types/brief'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { markApplied } from '@/app/actions/ready-to-send'
import { LoomInput } from './loom-input'
import {
  ExternalLink,
  Copy,
  Check,
  Briefcase,
  Clock,
  Video,
  Send,
  CheckCircle2,
  Globe,
  DollarSign,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getAirtableRecordUrl } from '@/lib/utils'

interface SendCardProps {
  job: Job
}

export function SendCard({ job }: SendCardProps) {
  const [copied, setCopied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  async function handleCopyCoverLetter() {
    if (!job.coverLetter) return
    await navigator.clipboard.writeText(job.coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMarkApplied() {
    setApplying(true)
    const result = await markApplied(job.id)
    if (result.success) {
      setApplied(true)
    } else {
      alert(`Failed to mark applied: ${result.error}`)
    }
    setApplying(false)
  }

  if (applied) {
    return null
  }

  const age = job.scrapedAt
    ? formatDistanceToNow(new Date(job.scrapedAt), { addSuffix: true })
    : 'Unknown'

  const skills = job.skills
    ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const airtableUrl = getAirtableRecordUrl(job.id)

  return (
    <Card className="overflow-hidden cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => airtableUrl && window.open(airtableUrl, '_blank')}>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {job.budgetAmount != null && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="font-medium text-gray-700">${job.budgetAmount}</span>
                  {job.budgetType && (
                    <span className="text-gray-400">({job.budgetType})</span>
                  )}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {age}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {job.stage}
          </Badge>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          {/* Step 1: Open Prototype */}
          <StepRow step={1} label="Open Prototype" icon={<Globe className="w-4 h-4" />}>
            {job.prototypeUrl ? (
              <a
                href={job.prototypeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Prototype"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Open Prototype
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Open Prototype
              </Button>
            )}
          </StepRow>

          {/* Step 2: Record Loom */}
          <StepRow step={2} label="Record Loom" icon={<Video className="w-4 h-4" />}>
            <LoomInput jobId={job.id} existingUrl={job.loomUrl} />
          </StepRow>

          {/* Step 3: Copy Cover Letter */}
          <StepRow step={3} label="Copy Cover Letter" icon={<Copy className="w-4 h-4" />}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCoverLetter}
              disabled={!job.coverLetter}
              aria-label="Copy Cover Letter"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Cover Letter
                </>
              )}
            </Button>
          </StepRow>

          {/* Step 4: Open Upwork */}
          <StepRow step={4} label="Open Upwork" icon={<Briefcase className="w-4 h-4" />}>
            {job.jobUrl ? (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Upwork"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
              >
                Open Upwork
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                Open Upwork
              </Button>
            )}
          </StepRow>

          {/* Step 5: Mark Applied */}
          <StepRow step={5} label="Mark Applied" icon={<Send className="w-4 h-4" />}>
            <Button
              size="sm"
              onClick={handleMarkApplied}
              disabled={applying}
              aria-label="Mark Applied"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {applying ? (
                <>
                  <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Mark Applied
                </>
              )}
            </Button>
          </StepRow>
        </div>
      </CardContent>
    </Card>
  )
}

function StepRow({
  step,
  label,
  icon,
  children,
}: {
  step: number
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold shrink-0">
        {step}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500 w-36 shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
