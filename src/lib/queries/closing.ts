import { TABLES, JOBS, STAGES, ENGAGEMENT_STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import { cacheTag, cacheLife } from 'next/cache'

/**
 * Safely get a field value -- returns undefined if the field doesn't exist.
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
 * Map an Airtable record to a Job object.
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
    jobUrl: (record.get(JOBS.JOB_URL) as string) || undefined,
    budgetAmount: (record.get(JOBS.BUDGET_AMOUNT) as number) || undefined,
    budgetType: (record.get(JOBS.BUDGET_TYPE) as string) || undefined,
    skills: (record.get(JOBS.SKILLS) as string) || undefined,
    client: safeGet(record, JOBS.CLIENT) as string | undefined,
    callCompletedDate: safeGet(record, JOBS.CALL_COMPLETED_DATE) as string | undefined,
    contractSentDate: safeGet(record, JOBS.CONTRACT_SENT_DATE) as string | undefined,
    closeDate: safeGet(record, JOBS.CLOSE_DATE) as string | undefined,
    dealValue: safeGet(record, JOBS.DEAL_VALUE) as number | undefined,
    lostReason: safeGet(record, JOBS.LOST_REASON) as string | undefined,
    prototypeUrl: (record.get(JOBS.PROTOTYPE_URL) as string) || undefined,
    loomUrl: (record.get(JOBS.LOOM_URL) as string) || undefined,
    lastFollowUpDate: safeGet(record, JOBS.LAST_FOLLOW_UP_DATE) as string | undefined,
    nextActionDate: (record.get(JOBS.NEXT_ACTION_DATE) as string) || undefined,
  }
}

/**
 * Fetch active deals for the closing dashboard.
 * Filters by engagement stages (Light Engagement, Engagement with prototype).
 * Uses simple stage-based filter since Response Type field may not exist yet.
 * Returns empty array on failure.
 */
export async function getActiveDeals(): Promise<Job[]> {
  'use cache'
  cacheTag('jobs-closing')
  cacheLife('dashboard')
  try {
    const base = getBase()

    const stageFilter = ENGAGEMENT_STAGES
      .map((stage) => `{${JOBS.STAGE}} = "${stage}"`)
      .join(', ')

    const filterByFormula = `OR(${stageFilter})`

    const records = await base(TABLES.JOBS_PIPELINE)
      .select({
        filterByFormula,
        sort: [{ field: JOBS.SCRAPED_AT, direction: 'asc' }],
        maxRecords: 50,
      })
      .all()

    return records.map(mapRecordToJob)
  } catch {
    // Fields may not exist yet — expected, return empty
    return []
  }
}

/**
 * Group deals by their progress status for the kanban board.
 *
 * Logic:
 * - engaged: Stage includes "Engagement" AND no Call Completed Date AND no Contract Sent Date
 * - callDone: Has Call Completed Date set AND no Contract Sent Date
 * - contractSent: Has Contract Sent Date set AND stage is NOT Closed Won
 * - won: Stage = Closed Won (last 7 days only)
 */
export function groupDealsByStatus(jobs: Job[]): {
  engaged: Job[]
  callDone: Job[]
  contractSent: Job[]
  won: Job[]
} {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const engaged: Job[] = []
  const callDone: Job[] = []
  const contractSent: Job[] = []
  const won: Job[] = []

  for (const job of jobs) {
    // Closed Won goes to won column (if within last 7 days)
    if (job.stage === STAGES.CLOSED_WON) {
      const closeDate = job.closeDate ? new Date(job.closeDate) : null
      if (closeDate && closeDate >= sevenDaysAgo) {
        won.push(job)
      }
      continue
    }

    // Contract Sent Date set -> contractSent column
    if (job.contractSentDate) {
      contractSent.push(job)
      continue
    }

    // Call Completed Date set -> callDone column
    if (job.callCompletedDate) {
      callDone.push(job)
      continue
    }

    // Otherwise -> engaged column (includes any engagement stage job without call/contract)
    engaged.push(job)
  }

  return { engaged, callDone, contractSent, won }
}
