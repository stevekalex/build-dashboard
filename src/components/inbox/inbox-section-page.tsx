'use client'

import { useState, useCallback } from 'react'
import { Job } from '@/types/brief'
import { InboxSection } from './inbox-section'
import { InboxCard } from './inbox-card'

type SectionType = 'hot-leads' | 'awaiting-response' | 'follow-ups'

interface InboxSectionPageProps {
  jobs: Job[]
  section: SectionType
  emoji: string
  title: string
  description: string
  filter: string
  emptyMessage: string
}

export function InboxSectionPage({
  jobs,
  section,
  emoji,
  title,
  description,
  filter,
  emptyMessage,
}: InboxSectionPageProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const dismissJob = useCallback((jobId: string) => {
    setDismissedIds((prev) => new Set(prev).add(jobId))
  }, [])

  const visibleJobs = jobs.filter((j) => !dismissedIds.has(j.id))

  return (
    <InboxSection
      emoji={emoji}
      title={title}
      count={visibleJobs.length}
      description={description}
      filter={filter}
      emptyMessage={emptyMessage}
    >
      {visibleJobs.map((job) => (
        <InboxCard key={job.id} job={job} section={section} onAction={dismissJob} />
      ))}
    </InboxSection>
  )
}
