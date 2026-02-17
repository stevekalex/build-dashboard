'use client'

import { useState, useCallback } from 'react'
import { Job } from '@/types/brief'
import { InboxSection } from './inbox-section'
import { InboxCard } from './inbox-card'

interface InboxViewProps {
  hotLeads: Job[]
  awaitingResponse: Job[]
  followUpsDue: Job[]
}

export function InboxView({
  hotLeads,
  awaitingResponse,
  followUpsDue,
}: InboxViewProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const dismissJob = useCallback((jobId: string) => {
    setDismissedIds((prev) => new Set(prev).add(jobId))
  }, [])

  const visibleHotLeads = hotLeads.filter((j) => !dismissedIds.has(j.id))
  const visibleFollowUpsDue = followUpsDue.filter((j) => !dismissedIds.has(j.id))
  const visibleAwaitingResponse = awaitingResponse.filter((j) => !dismissedIds.has(j.id))

  return (
    <div className="space-y-4">
      <InboxSection
        emoji="🔥"
        title="Hot Leads"
        count={visibleHotLeads.length}
        description="Clients who responded positively. These are warm leads — act fast."
        filter="Response Type is Shortlist, Interview, or Hire, and deal is not closed."
        emptyMessage="No hot leads right now"
      >
        {visibleHotLeads.map((job) => (
          <InboxCard key={job.id} job={job} section="hot-leads" onAction={dismissJob} />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📆"
        title="Follow-ups Due"
        count={visibleFollowUpsDue.length}
        description="Follow-ups that are due today or overdue. Send a message to stay top of mind."
        filter="Next Action Date is today or earlier."
        emptyMessage="No follow-ups due today"
      >
        {visibleFollowUpsDue.map((job) => (
          <InboxCard key={job.id} job={job} section="follow-ups-due" onAction={dismissJob} />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📬"
        title="Awaiting Response"
        count={visibleAwaitingResponse.length}
        description="Jobs you applied to but haven't heard back yet. No action needed — just monitoring."
        filter="Applied At is set, but Response Date is empty."
        emptyMessage="No jobs awaiting response"
      >
        {visibleAwaitingResponse.map((job) => (
          <InboxCard key={job.id} job={job} section="awaiting-response" onAction={dismissJob} />
        ))}
      </InboxSection>
    </div>
  )
}
