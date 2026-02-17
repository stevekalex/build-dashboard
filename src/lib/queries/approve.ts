import { TABLES, JOBS, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import yaml from 'js-yaml'

/**
 * Fetch jobs pending human approval from Airtable.
 *
 * Uses Lookup fields on Jobs Pipeline to read Build Details data
 * in a single API call (no N+1 secondary lookups).
 *
 * Filters:
 * - Stage = "⏸️ Pending Approval"
 * - Build: Buildable = TRUE (via Lookup field in filterByFormula)
 * Sorted by Scraped At ASC (oldest first)
 */
export async function getJobsToApprove(): Promise<Job[]> {
  const base = getBase()

  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `AND({${JOBS.STAGE}} = "${STAGES.PENDING_APPROVAL}", {${JOBS.BUILD_BUILDABLE}} = TRUE())`,
      sort: [{ field: JOBS.SCRAPED_AT, direction: 'asc' }],
    })
    .all()

  return records.map((record) => {
    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
    const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
    const scrapedAt = (record.get(JOBS.SCRAPED_AT) as string) || new Date().toISOString()
    const budgetAmount = record.get(JOBS.BUDGET_AMOUNT) as number | undefined
    const budgetType = record.get(JOBS.BUDGET_TYPE) as string | undefined
    const skills = record.get(JOBS.SKILLS) as string | undefined

    // Read from Lookup fields — these return single-element arrays for 1-to-1 links
    const buildableReasoning = (lookupString(record, JOBS.BUILD_BUILDABLE_REASONING)) || ''
    const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || ''

    const parsedData = brief ? parseBriefData(brief) : {}

    return {
      id: record.id,
      jobId,
      title,
      description,
      stage: STAGES.PENDING_APPROVAL as string,
      scrapedAt,
      buildable: true, // guaranteed by filterByFormula
      buildableReasoning,
      brief,
      template: parsedData.template ?? ('unknown' as const),
      routes: parsedData.routes,
      uniqueInteractions: parsedData.uniqueInteractions,
      budgetAmount,
      budgetType,
      skills,
    }
  })
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
