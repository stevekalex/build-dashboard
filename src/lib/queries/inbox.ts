import { TABLES, JOBS, STAGES, CLOSED_STAGES, FOLLOW_UP_STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import { cacheTag, cacheLife } from 'next/cache'

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
 * Sort by Response Date DESC.
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

    const records = await base(TABLES.JOBS_PIPELINE)
      .select({
        filterByFormula,
        sort: [{ field: JOBS.SCRAPED_AT, direction: 'desc' }],
      })
      .all()

    return records.map(mapRecordToJob)
  } catch {
    // Response Type field likely doesn't exist yet — expected, return empty
    return []
  }
}

/**
 * Fetch jobs awaiting response: applied but no response yet.
 * Filter: Stage IN follow-up stages AND Response Date = BLANK().
 * Sort by Applied At ASC.
 *
 * Falls back to stage-only filter if Response Date field doesn't exist.
 */
export async function getAwaitingResponse(): Promise<Job[]> {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  try {
    const base = getBase()

    const stageFilter = FOLLOW_UP_STAGES
      .map((stage) => `{${JOBS.STAGE}} = "${stage}"`)
      .join(', ')

    // Try with Response Date filter first
    let filterByFormula = `AND(OR(${stageFilter}), {${JOBS.RESPONSE_DATE}} = BLANK())`

    try {
      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.APPLIED_AT, direction: 'asc' }],
        })
        .all()

      return records.map(mapRecordToJob)
    } catch {
      // Response Date field doesn't exist yet — fall back to stage-only filter
      filterByFormula = `OR(${stageFilter})`

      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.APPLIED_AT, direction: 'asc' }],
        })
        .all()

      return records.map(mapRecordToJob)
    }
  } catch {
    // Fields may not exist yet — expected, return empty
    return []
  }
}

/**
 * Fetch follow-ups due: jobs needing follow-up messages today or overdue.
 * Filter: Applied At NOT BLANK() AND Response Date = BLANK()
 *   AND Next Action Date <= TODAY() AND Stage NOT IN closed stages.
 * Sort by Next Action Date ASC.
 *
 * Falls back to simpler filter if new fields don't exist.
 */
export async function getFollowUpsDue(): Promise<Job[]> {
  'use cache'
  cacheTag('jobs-inbox')
  cacheLife('dashboard')
  try {
    const base = getBase()

    const closedFilter = CLOSED_STAGES
      .map((stage) => `{${JOBS.STAGE}} = "${stage}"`)
      .join(', ')

    // Try full filter first
    let filterByFormula = `AND({${JOBS.APPLIED_AT}} != BLANK(), {${JOBS.RESPONSE_DATE}} = BLANK(), {${JOBS.NEXT_ACTION_DATE}} <= TODAY(), NOT(OR(${closedFilter})))`

    try {
      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.NEXT_ACTION_DATE, direction: 'asc' }],
        })
        .all()

      return records.map(mapRecordToJob)
    } catch {
      // Response Date field doesn't exist yet — simplified filter
      filterByFormula = `AND({${JOBS.APPLIED_AT}} != BLANK(), {${JOBS.NEXT_ACTION_DATE}} <= TODAY(), NOT(OR(${closedFilter})))`

      const records = await base(TABLES.JOBS_PIPELINE)
        .select({
          filterByFormula,
          sort: [{ field: JOBS.NEXT_ACTION_DATE, direction: 'asc' }],
        })
        .all()

      return records.map(mapRecordToJob)
    }
  } catch {
    // Fields may not exist yet — expected, return empty
    return []
  }
}
