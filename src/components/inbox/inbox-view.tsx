'use client'

import { useOptimistic } from 'react'
import { Job } from '@/types/brief'
import { InboxSection } from './inbox-section'
import { InboxCard } from './inbox-card'

interface InboxViewProps {
  hotLeads: Job[]
  awaitingResponse: Job[]
  followUpsDue: Job[]
}

type SectionKey = 'hotLeads' | 'awaitingResponse' | 'followUpsDue'

export function InboxView({
  hotLeads,
  awaitingResponse,
  followUpsDue,
}: InboxViewProps) {
  const [optimistic, removeFromSection] = useOptimistic(
    { hotLeads, awaitingResponse, followUpsDue },
    (state: Record<SectionKey, Job[]>, action: { section: SectionKey; jobId: string }) => ({
      ...state,
      [action.section]: state[action.section].filter((j) => j.id !== action.jobId),
    })
  )

  function handleRemove(section: SectionKey) {
    return (jobId: string) => removeFromSection({ section, jobId })
  }

  return (
    <div className="space-y-4">
      <InboxSection
        emoji="🔥"
        title="Hot Leads"
        count={optimistic.hotLeads.length}
        description="Clients who responded positively. These are warm leads — act fast."
        filter="Response Type is Shortlist, Interview, or Hire, and deal is not closed."
        emptyMessage="No hot leads right now"
      >
        {optimistic.hotLeads.map((job) => (
          <InboxCard key={job.id} job={job} section="hot-leads" onAction={handleRemove('hotLeads')} />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📆"
        title="Follow-ups Due"
        count={optimistic.followUpsDue.length}
        description="Follow-ups that are due today or overdue. Send a message to stay top of mind."
        filter="Next Action Date is today or earlier."
        emptyMessage="No follow-ups due today"
      >
        {optimistic.followUpsDue.map((job) => (
          <InboxCard key={job.id} job={job} section="follow-ups-due" onAction={handleRemove('followUpsDue')} />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📬"
        title="Awaiting Response"
        count={optimistic.awaitingResponse.length}
        description="Jobs you applied to but haven't heard back yet. No action needed — just monitoring."
        filter="Applied At is set, but Response Date is empty."
        emptyMessage="No jobs awaiting response"
      >
        {optimistic.awaitingResponse.map((job) => (
          <InboxCard key={job.id} job={job} section="awaiting-response" onAction={handleRemove('awaitingResponse')} />
        ))}
      </InboxSection>
    </div>
  )
}
