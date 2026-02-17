import { TABLES, JOBS, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'

/**
 * Fetch jobs that are ready to send as applications.
 *
 * Uses Lookup fields on Jobs Pipeline to read Build Details data
 * in a single API call (no N+1 secondary lookups).
 *
 * Filters for deployed/prototype built stages where Applied At is blank.
 * Sorted by Scraped At ascending (oldest first — speed advantage).
 */
export async function getReadyToSend(): Promise<Job[]> {
  const base = getBase()

  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `AND(
        OR({${JOBS.STAGE}} = "${STAGES.DEPLOYED}", {${JOBS.STAGE}} = "${STAGES.PROTOTYPE_BUILT}"),
        {${JOBS.APPLIED_AT}} = BLANK()
      )`,
      sort: [{ field: JOBS.SCRAPED_AT, direction: 'asc' }],
    })
    .all()

  return records.map((record) => {
    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
    const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
    const stage = (record.get(JOBS.STAGE) as string) || ''
    const scrapedAt = (record.get(JOBS.SCRAPED_AT) as string) || new Date().toISOString()

    // Application-related fields from Jobs Pipeline
    const coverLetter = record.get(JOBS.AI_COVER_LETTER) as string | undefined
    const aiLoomOutline = record.get(JOBS.AI_LOOM_OUTLINE) as string | undefined
    const jobUrl = record.get(JOBS.JOB_URL) as string | undefined
    const loomUrl = record.get(JOBS.LOOM_URL) as string | undefined
    const budgetAmount = record.get(JOBS.BUDGET_AMOUNT) as number | undefined
    const budgetType = record.get(JOBS.BUDGET_TYPE) as string | undefined
    const skills = record.get(JOBS.SKILLS) as string | undefined

    // Prototype URL: prefer Jobs Pipeline field, fall back to Build Details Lookup
    const prototypeUrl =
      (record.get(JOBS.PROTOTYPE_URL) as string | undefined) ||
      lookupString(record, JOBS.BUILD_PROTOTYPE_URL)

    // Brief data from Lookup field
    const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || undefined
    const template = parseTemplate(brief)

    return {
      id: record.id,
      jobId,
      title,
      description,
      stage,
      scrapedAt,
      prototypeUrl,
      brief,
      template,
      coverLetter,
      aiLoomOutline,
      jobUrl,
      loomUrl,
      budgetAmount,
      budgetType,
      skills,
    } satisfies Job
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
 * Parse template type from brief YAML/JSON string
 */
function parseTemplate(brief?: string): 'dashboard' | 'web_app' | 'unknown' {
  if (!brief) return 'unknown'
  try {
    let parsed: any
    try {
      parsed = JSON.parse(brief)
    } catch {
      // Try YAML-style detection
      if (brief.includes('template: dashboard')) return 'dashboard'
      if (brief.includes('template: web_app')) return 'web_app'
      return 'unknown'
    }
    if (parsed?.template === 'dashboard') return 'dashboard'
    if (parsed?.template === 'web_app') return 'web_app'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
