import { TABLES, JOBS, BUILD, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'

/**
 * Fetch jobs that are ready to send as applications.
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

  const jobs = await Promise.all(
    records.map(async (record) => {
      const buildDetailsIds = record.get(JOBS.BUILD_DETAILS) as string[] | null
      const buildDetailsId = buildDetailsIds && buildDetailsIds.length > 0 ? buildDetailsIds[0] : null

      let buildData: any = null
      if (buildDetailsId) {
        try {
          const buildDetailsRecord = await base(TABLES.BUILD_DETAILS).find(buildDetailsId)
          buildData = buildDetailsRecord.fields
        } catch (error) {
          console.error('Failed to fetch Build Details:', error)
        }
      }

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

      // Prototype URL: prefer Jobs Pipeline field, fall back to Build Details
      const prototypeUrl =
        (record.get(JOBS.PROTOTYPE_URL) as string | undefined) ||
        (buildData?.[BUILD.PROTOTYPE_URL] as string | undefined)

      // Brief data from Build Details
      const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || undefined
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
  )

  return jobs
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
