import Airtable from 'airtable'
import yaml from 'js-yaml'
import { Brief, Build } from '@/types/brief'
import { TABLES, JOBS, BUILD, STAGES } from './airtable-fields'

// Initialize Airtable client
export function getBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY!,
  }).base(process.env.AIRTABLE_BASE_ID!)
}

/**
 * Fetch briefs that are pending approval from Airtable
 */
export async function getBriefsPendingApproval(): Promise<Brief[]> {
  const base = getBase()
  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `{${JOBS.STAGE}} = "${STAGES.PENDING_APPROVAL}"`,
    })
    .all()

  const briefs = await Promise.all(
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
      const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()

      const buildable = buildData?.[BUILD.BUILDABLE] ?? false
      const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || ''
      const status = (buildData?.[BUILD.STATUS] as string) || 'pending'

      const parsedData = brief ? parseBriefData(brief) : {}

      return {
        id: record.id,
        jobId,
        title,
        description,
        template: parsedData.template ?? ('unknown' as const),
        buildable,
        brief,
        routes: parsedData.routes,
        uniqueInteractions: parsedData.uniqueInteractions,
        createdAt,
        status: mapStatus(status),
      }
    })
  )

  return briefs
}

/**
 * Fetch a single brief by ID from Airtable
 */
export async function getBriefById(id: string): Promise<Brief | null> {
  const base = getBase()

  try {
    const record = await base(TABLES.JOBS_PIPELINE).find(id)

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
    const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()

    const buildable = buildData?.[BUILD.BUILDABLE] ?? false
    const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || ''
    const status = (buildData?.[BUILD.STATUS] as string) || 'pending'

    const parsedData = brief ? parseBriefData(brief) : {}

    return {
      id: record.id,
      jobId,
      title,
      description,
      buildable,
      brief,
      routes: parsedData.routes,
      template: parsedData.template ?? ('unknown' as const),
      uniqueInteractions: parsedData.uniqueInteractions,
      createdAt,
      status: mapStatus(status),
    }
  } catch (error) {
    console.error('Failed to fetch brief by ID:', error)
    return null
  }
}

/**
 * Map Airtable status to our internal status
 */
function mapStatus(airtableStatus: string): Brief['status'] {
  const statusMap: Record<string, Brief['status']> = {
    Evaluated: 'pending',
    Building: 'building',
    Completed: 'complete',
    Failed: 'failed',
    Approved: 'approved',
  }

  return statusMap[airtableStatus] || 'pending'
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
      template: parsed?.template === 'dashboard' || parsed?.template === 'web_app'
        ? parsed.template
        : undefined,
      uniqueInteractions: parsed?.unique_interactions || parsed?.uniqueInteractions || '',
    }
  } catch (error) {
    console.error('Failed to parse brief data:', error)
    return {}
  }
}

/**
 * Fetch all builds (approved, deployed, failed) for the kanban view
 * Returns last 37 builds sorted by most recent first
 */
export async function getAllBuilds(): Promise<Build[]> {
  const base = getBase()

  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `OR(
        {${JOBS.STAGE}} = "${STAGES.APPROVED}",
        {${JOBS.STAGE}} = "${STAGES.DEPLOYED}",
        {${JOBS.STAGE}} = "${STAGES.BUILD_FAILED}"
      )`,
      sort: [{ field: JOBS.SCRAPED_AT, direction: 'desc' }],
      maxRecords: 37,
    })
    .all()

  const builds = await Promise.all(
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
      const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()
      const stageRaw = (record.get(JOBS.STAGE) as string) || ''

      const status = (buildData?.[BUILD.STATUS] as string) || 'building'
      const buildStarted = buildData?.[BUILD.BUILD_STARTED] as string | undefined
      const buildCompleted = buildData?.[BUILD.BUILD_COMPLETED] as string | undefined
      const buildDuration = buildData?.[BUILD.BUILD_DURATION] as number | undefined
      const prototypeUrl = buildData?.[BUILD.PROTOTYPE_URL] as string | undefined
      const buildError = buildData?.[BUILD.BUILD_ERROR] as string | undefined
      const brief = (buildData?.[BUILD.BRIEF_YAML] as string) || ''

      const parsedData = brief ? parseBriefData(brief) : {}

      return {
        id: record.id,
        jobId,
        title,
        description,
        stage: mapStage(stageRaw),
        status: mapBuildStatus(status),
        template: parsedData.template ?? ('unknown' as const),
        buildStarted,
        buildCompleted,
        buildDuration,
        prototypeUrl,
        buildError,
        createdAt,
      }
    })
  )

  return builds
}

/**
 * Map Jobs Pipeline stage to our internal stage type
 */
function mapStage(stage: string): Build['stage'] {
  if (stage.includes('Approved')) return 'approved'
  if (stage.includes('Deployed')) return 'deployed'
  if (stage.includes('Failed')) return 'failed'
  return 'approved'
}

/**
 * Map Build Details status to our internal status type
 */
function mapBuildStatus(status: string): Build['status'] {
  const statusMap: Record<string, Build['status']> = {
    Building: 'building',
    Evaluated: 'evaluated',
    Completed: 'completed',
    Failed: 'failed',
  }
  return statusMap[status] || 'building'
}
