import { TABLES, JOBS, STAGES, CLOSED_STAGES, FOLLOW_UP_STAGES, TOUCHPOINT_PROGRESSION } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import { cacheTag, cacheLife } from 'next/cache'

/**
 * Sort jobs by Next Action Date descending.
 * Jobs without a Next Action Date are pushed to the end.
 * Logs a warning for jobs missing this field so gaps are visible.
 */
function sortByNextActionDate(jobs: Job[], sectionLabel: string): Job[] {
  const withDate: Job[] = []
  const withoutDate: Job[] = []

  for (const job of jobs) {
    if (job.nextActionDate) {
      withDate.push(job)
    } else {
      withoutDate.push(job)
      console.warn({
        warning: 'missing_next_action_date',
        section: sectionLabel,
        jobId: job.jobId,
        title: job.title,
        stage: job.stage,
        timestamp: new Date().toISOString(),
      })
    }
  }

  withDate.sort((a, b) => {
    const dateA = new Date(a.nextActionDate!).getTime()
    const dateB = new Date(b.nextActionDate!).getTime()
    return dateB - dateA // descending
  })

  return [...withDate, ...withoutDate]
}

/**
 * Map an Airtable record to a Job object.
 * Shared across all inbox query functions.
 * Uses safe field access — new fields that don't exist yet return undefined.
 */
function mapRecordToJob(record: any): Job {
  return {
    id: record.id,
    jobId: (record.get('Job ID') as string) || record.id,
    title: (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job',
    description: (record.get(JOBS.JOB_DESCRIPTION) as string) || '',
    stage: (record.get(JOBS.STAGE) as string) || '',
    scrapedAt: (record.get(JOBS.SCRAPED_AT) as string) || '',
    appliedAt: (record.get(JOBS.APPLIED_AT) as string) || undefined,
    responseDate: safeGet(record, JOBS.RESPONSE_DATE) as string | undefined,
    responseType: safeGet(record, JOBS.RESPONSE_TYPE) as string | undefined,
    nextActionDate: (record.get(JOBS.NEXT_ACTION_DATE) as string) || undefined,
    lastFollowUpDate: safeGet(record, JOBS.LAST_FOLLOW_UP_DATE) as string | undefined,
    prototypeUrl: (record.get(JOBS.PROTOTYPE_URL) as string) || undefined,
    jobUrl: (record.get(JOBS.JOB_URL) as string) || undefined,
    budgetAmount: (record.get(JOBS.BUDGET_AMOUNT) as number) || undefined,
    budgetType: (record.get(JOBS.BUDGET_TYPE) as string) || undefined,
    skills: (record.get(JOBS.SKILLS) as string) || undefined,
    client: safeGet(record, JOBS.CLIENT) as string | undefined,
    loomUrl: (record.get(JOBS.LOOM_URL) as string) || undefined,
    dealValue: safeGet(record, JOBS.DEAL_VALUE) as number | undefined,
  }
}

/**
 * Safely get a field value — returns undefined if the field doesn't exist.
 * Needed for new fields that may not be created in Airtable yet.
 */
function safeGet(record: any, field: string): unknown {
  try {
    return record.get(field) || undefined
  } catch {
    return undefined
  }
}

/**
 * Fetch hot leads: clients who have shown strong interest.
 * Filter: Response Type IN (Shortlist, Interview, Hire) AND Stage NOT IN closed stages.
 * Sort by Next Action Date DESC.
 *
 * Returns empty array if Response Type field doesn't exist yet in Airtable.
 */
export async function getHotLeads(): Promise<Job[]> {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  try {
    const base = getBase()

    const hotLeadTypes = ['Shortlist', 'Interview', 'Hire']
    const responseTypeFilter = hotLeadTypes
      .map((type) => `{${JOBS.RESPONSE_TYPE}} = "${type}"`)
      .join(', ')

    const closedFilter = CLOSED_STAGES
      .map((stage) => `{${JOBS.STAGE}} = "${stage}"`)
      .join(', ')

    const filterByFormula = `AND(OR(${responseTypeFilter}), NOT(OR(${closedFilter})))`

    try {
      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.SCRAPED_AT, direction: 'desc' }],
          maxRecords: 50,
        })
        .all()

      return sortByNextActionDate(records.map(mapRecordToJob), 'Hot Leads')
    } catch {
      // Response Type field doesn't exist yet in Airtable — no hot leads to show
      console.warn('getHotLeads: Response Type field not found in Airtable — returning empty. Create this field to enable hot leads.')
      return []
    }
  } catch (error) {
    console.error('getHotLeads failed:', error instanceof Error ? error.message : error)
    return []
  }
}

export interface HotLeadColumns {
  shortlist: Job[]
  interview: Job[]
  hire: Job[]
}

export function groupHotLeadsByResponseType(jobs: Job[]): HotLeadColumns {
  const columns: HotLeadColumns = { shortlist: [], interview: [], hire: [] }
  for (const job of jobs) {
    switch (job.responseType) {
      case 'Shortlist': columns.shortlist.push(job); break
      case 'Interview': columns.interview.push(job); break
      case 'Hire': columns.hire.push(job); break
    }
  }
  return columns
}

export interface FollowUpColumns {
  followUp1: Job[]
  followUp2: Job[]
  followUp3: Job[]
}

/**
 * Group follow-up jobs by urgency (overdue vs upcoming) and stage for the kanban boards.
 *
 * Two boards:
 * - overdue: nextActionDate is in the past (or missing)
 * - upcoming: nextActionDate is in the future
 *
 * Column mapping within each board:
 * - followUp1: Touchpoint 1 → re-surface Loom with different hook
 * - followUp2: Touchpoint 2 → bridge to full project + call
 * - followUp3: Touchpoint 3 → offer to adjust prototype
 * - closeOut: (unused — Touchpoint 3 is the final message, then close as lost)
 */
export function groupFollowUpsByStage(jobs: Job[]): {
  overdue: FollowUpColumns
  upcoming: FollowUpColumns
} {
  const emptyColumns = (): FollowUpColumns => ({
    followUp1: [],
    followUp2: [],
    followUp3: [],
  })

  const overdue = emptyColumns()
  const upcoming = emptyColumns()
  const now = Date.now()

  for (const job of jobs) {
    const isOverdue = !job.nextActionDate || new Date(job.nextActionDate).getTime() <= now
    const target = isOverdue ? overdue : upcoming

    switch (job.stage) {
      case STAGES.TOUCHPOINT_1:
        target.followUp1.push(job)
        break
      case STAGES.TOUCHPOINT_2:
        target.followUp2.push(job)
        break
      case STAGES.TOUCHPOINT_3:
        target.followUp3.push(job)
        break
    }
  }

  return { overdue, upcoming }
}

/**
 * Fetch all jobs that need follow-up: in follow-up stages with no response yet.
 * Filter: Stage IN follow-up stages AND Response Date = BLANK().
 * Sort by Next Action Date ASC (soonest due first).
 *
 * Falls back to stage-only filter if Response Date field doesn't exist.
 */
export async function getFollowUps(): Promise<Job[]> {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  try {
    const base = getBase()

    const stageFilter = FOLLOW_UP_STAGES
      .map((stage) => `{${JOBS.STAGE}} = "${stage}"`)
      .join(', ')

    let filterByFormula = `AND(OR(${stageFilter}), {${JOBS.RESPONSE_DATE}} = BLANK())`

    try {
      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.NEXT_ACTION_DATE, direction: 'asc' }],
          maxRecords: 100,
        })
        .all()

      return sortByNextActionDate(records.map(mapRecordToJob), 'Follow Ups')
    } catch {
      // Response Date field doesn't exist yet — fall back to stage-only filter
      filterByFormula = `OR(${stageFilter})`

      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.NEXT_ACTION_DATE, direction: 'asc' }],
          maxRecords: 100,
        })
        .all()

      return sortByNextActionDate(records.map(mapRecordToJob), 'Follow Ups')
    }
  } catch (error) {
    console.error('getFollowUps failed:', error instanceof Error ? error.message : error)
    return []
  }
}
