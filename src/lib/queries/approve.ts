import { TABLES, JOBS, BUILD, STAGES } from '@/lib/airtable-fields'
import { getBase } from '@/lib/airtable'
import { Job } from '@/types/brief'
import yaml from 'js-yaml'

/**
 * Fetch jobs pending human approval from Airtable.
 *
 * Filters:
 * - Stage = "⏸️ Pending Approval"
 * - Build Details -> Buildable = true
 * Sorted by Scraped At ASC (oldest first)
 */
export async function getJobsToApprove(): Promise<Job[]> {
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

      // Only include buildable jobs
      const buildable = buildData?.[BUILD.BUILDABLE] ?? false
      if (!buildable) return null

      const jobId = (record.get('Job ID') as string) || record.id
      const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
      const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
      const scrapedAt = (record.get(JOBS.SCRAPED_AT) as string) || new Date().toISOString()
      const budgetAmount = record.get(JOBS.BUDGET_AMOUNT) as number | undefined
      const budgetType = record.get(JOBS.BUDGET_TYPE) as string | undefined
      const skills = record.get(JOBS.SKILLS) as string | undefined

      const buildableReasoning = (buildData?.[BUILD.BUILDABLE_REASONING] as string) || ''
      const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || ''

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
    })
  )

  // Filter out null entries (non-buildable jobs)
  return jobs.filter((job) => job !== null) as Job[]
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
