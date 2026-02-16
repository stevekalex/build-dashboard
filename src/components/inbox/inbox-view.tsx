'use client'

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
  return (
    <div className="space-y-4">
      <InboxSection
        emoji="🔥"
        title="Hot Leads"
        count={hotLeads.length}
        emptyMessage="No hot leads right now"
      >
        {hotLeads.map((job) => (
          <InboxCard key={job.id} job={job} section="hot-leads" />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📬"
        title="Awaiting Response"
        count={awaitingResponse.length}
        emptyMessage="No jobs awaiting response"
      >
        {awaitingResponse.map((job) => (
          <InboxCard key={job.id} job={job} section="awaiting-response" />
        ))}
      </InboxSection>

      <InboxSection
        emoji="📆"
        title="Follow-ups Due"
        count={followUpsDue.length}
        emptyMessage="No follow-ups due today"
      >
        {followUpsDue.map((job) => (
          <InboxCard key={job.id} job={job} section="follow-ups-due" />
        ))}
      </InboxSection>
    </div>
  )
}
