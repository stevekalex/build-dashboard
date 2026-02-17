import { TABLES, JOBS, BUILD, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import yaml from 'js-yaml'

/**
 * Fetch jobs pending human approval from Airtable.
 *
 * Attempts Lookup field approach first (single API call).
 * Falls back to N+1 Build Details lookups if Lookup fields don't exist yet.
 *
 * Filters:
 * - Stage = "⏸️ Pending Approval"
 * - Build: Buildable = TRUE (via Lookup field in filterByFormula, or in-memory post-filter)
 * Sorted by Scraped At ASC (oldest first)
 */
export async function getJobsToApprove(): Promise<Job[]> {
  try {
    return await getJobsToApproveLookup()
  } catch {
    console.warn('Lookup fields not available, falling back to N+1 Build Details lookups')
    return await getJobsToApproveFallback()
  }
}

/**
 * Primary path: uses Lookup fields on Jobs Pipeline (single API call).
 */
async function getJobsToApproveLookup(): Promise<Job[]> {
  const base = getBase()

  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `AND({${JOBS.STAGE}} = "${STAGES.PENDING_APPROVAL}", {${JOBS.BUILD_BUILDABLE}} = TRUE())`,
      sort: [{ field: JOBS.SCRAPED_AT, direction: 'asc' }],
    })
    .all()

  return records.map((record) => mapRecordWithLookups(record, true))
}

/**
 * Fallback path: N+1 Build Details lookups (used when Lookup fields don't exist in Airtable yet).
 */
async function getJobsToApproveFallback(): Promise<Job[]> {
  const base = getBase()

  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `{${JOBS.STAGE}} = "${STAGES.PENDING_APPROVAL}"`,
      sort: [{ field: JOBS.SCRAPED_AT, direction: 'asc' }],
    })
    .all()

  const jobs = await Promise.all(
    records.map(async (record) => {
      const buildDetailsIds = record.get(JOBS.BUILD_DETAILS) as string[] | null
      const buildDetailsId = buildDetailsIds?.[0] ?? null

      let buildData: any = null
      if (buildDetailsId) {
        try {
          const buildDetailsRecord = await base(TABLES.BUILD_DETAILS).find(buildDetailsId)
          buildData = buildDetailsRecord.fields
        } catch (error) {
          console.error('Failed to fetch Build Details:', error)
        }
      }

      const buildable = buildData?.[BUILD.BUILDABLE] ?? false
      if (!buildable) return null

      const buildableReasoning = (buildData?.[BUILD.BUILDABLE_REASONING] as string) || ''
      const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || ''

      return mapRecordToJob(record, buildable, buildableReasoning, brief)
    })
  )

  return jobs.filter((job): job is Job => job !== null)
}

/**
 * Map a record using Lookup fields (primary path).
 */
function mapRecordWithLookups(record: any, buildable: boolean): Job {
  const buildableReasoning = lookupString(record, JOBS.BUILD_BUILDABLE_REASONING) || ''
  const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || ''
  return mapRecordToJob(record, buildable, buildableReasoning, brief)
}

/**
 * Shared record-to-Job mapper used by both paths.
 */
function mapRecordToJob(record: any, buildable: boolean, buildableReasoning: string, brief: string): Job {
  const jobId = (record.get('Job ID') as string) || record.id
  const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
  const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
  const scrapedAt = (record.get(JOBS.SCRAPED_AT) as string) || new Date().toISOString()
  const budgetAmount = record.get(JOBS.BUDGET_AMOUNT) as number | undefined
  const budgetType = record.get(JOBS.BUDGET_TYPE) as string | undefined
  const skills = record.get(JOBS.SKILLS) as string | undefined

  const parsedData = brief ? parseBriefData(brief) : {}

  return {
    id: record.id,
    jobId,
    title,
    description,
    stage: STAGES.PENDING_APPROVAL as string,
    scrapedAt,
    buildable,
    buildableReasoning,
    brief,
    template: parsedData.template ?? ('unknown' as const),
    routes: parsedData.routes,
    uniqueInteractions: parsedData.uniqueInteractions,
    budgetAmount,
    budgetType,
    skills,
  }
}

/**
 * Safely read a Lookup field value (returns first element of the array).
 * Lookup fields on 1-to-1 links return single-element arrays like ["value"].
 */
function lookupString(record: any, field: string): string | undefined {
  const val = record.get(field)
  if (Array.isArray(val)) return val[0] as string | undefined
  if (typeof val === 'string') return val
  return undefined
}

/**
 * Parse brief JSON/YAML and extract routes, template, and unique interactions
 */
function parseBriefData(briefData: string): {
  routes?: any[]
  template?: 'dashboard' | 'web_app'
  uniqueInteractions?: string
} {
  try {
    let parsed: any
    try {
      parsed = JSON.parse(briefData)
    } catch {
      parsed = yaml.load(briefData) as any
    }

    return {
      routes: parsed?.routes || parsed?.pages || [],
      template:
        parsed?.template === 'dashboard' || parsed?.template === 'web_app'
          ? parsed.template
          : undefined,
      uniqueInteractions: parsed?.unique_interactions || parsed?.uniqueInteractions || '',
    }
  } catch (error) {
    console.error('Failed to parse brief data:', error)
    return {}
  }
}
