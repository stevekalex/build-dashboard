import Airtable from 'airtable'
import yaml from 'js-yaml'
import { Brief, Build } from '@/types/brief'
import { TABLES, JOBS, STAGES } from './airtable-fields'
import { cacheTag, cacheLife } from 'next/cache'

// Initialize Airtable client (singleton)
let _base: ReturnType<InstanceType<typeof Airtable>['base']> | null = null

export function getBase() {
  if (!_base) {
    _base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY!,
    }).base(process.env.AIRTABLE_BASE_ID!)
  }
  return _base
}

/**
 * Fetch briefs that are pending approval from Airtable.
 * Uses Lookup fields — single API call, no N+1.
 */
export async function getBriefsPendingApproval(): Promise<Brief[]> {
  'use cache'
  cacheTag('jobs-approve')
  cacheLife('dashboard')
  const base = getBase()
  const records = await base(TABLES.JOBS_PIPELINE)
    .select({
      filterByFormula: `{${JOBS.STAGE}} = "${STAGES.PENDING_APPROVAL}"`,
    })
    .all()

  return records.map((record) => {
    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
    const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
    const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()

    const buildable = lookupBoolean(record, JOBS.BUILD_BUILDABLE)
    const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || ''

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
      status: 'pending' as Brief['status'],
    }
  })
}

/**
 * Fetch a single brief by ID from Airtable.
 * Uses Lookup fields — single API call, no secondary Build Details fetch.
 */
export async function getBriefById(id: string): Promise<Brief | null> {
  'use cache'
  cacheTag(`brief-${id}`)
  cacheLife('analytics')
  const base = getBase()

  try {
    const record = await base(TABLES.JOBS_PIPELINE).find(id)

    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
    const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
    const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()

    const buildable = lookupBoolean(record, JOBS.BUILD_BUILDABLE)
    const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || ''

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
      status: 'pending' as Brief['status'],
    }
  } catch (error) {
    console.error('Failed to fetch brief by ID:', error)
    return null
  }
}

/**
 * Safely read a Lookup field string value (returns first element of the array).
 * Lookup fields on 1-to-1 links return single-element arrays like ["value"].
 */
function lookupString(record: any, field: string): string | undefined {
  const val = record.get(field)
  if (Array.isArray(val)) return val[0] as string | undefined
  if (typeof val === 'string') return val
  return undefined
}

/**
 * Safely read a Lookup field boolean value.
 */
function lookupBoolean(record: any, field: string): boolean {
  const val = record.get(field)
  if (Array.isArray(val)) return val[0] === true
  return val === true
}

/**
 * Safely read a Lookup field number value.
 */
function lookupNumber(record: any, field: string): number | undefined {
  const val = record.get(field)
  if (Array.isArray(val)) return typeof val[0] === 'number' ? val[0] : undefined
  return typeof val === 'number' ? val : undefined
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
 * Fetch all builds (approved, deployed, failed) for the kanban view.
 * Uses Lookup fields — single API call, no N+1.
 * Returns last 37 builds sorted by most recent first.
 */
export async function getAllBuilds(): Promise<Build[]> {
  'use cache'
  cacheTag('builds-all')
  cacheLife('dashboard')
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

  return records.map((record) => {
    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job'
    const description = (record.get(JOBS.JOB_DESCRIPTION) as string) || ''
    const createdAt = (record.get(JOBS.SCRAPED_AT) as string) || (record as any)._createdTime || new Date().toISOString()
    const stageRaw = (record.get(JOBS.STAGE) as string) || ''

    const buildStarted = lookupString(record, JOBS.BUILD_STARTED)
    const buildCompleted = lookupString(record, JOBS.BUILD_COMPLETED)
    const buildDuration = lookupNumber(record, JOBS.BUILD_DURATION)
    const prototypeUrl = lookupString(record, JOBS.BUILD_PROTOTYPE_URL)
    const buildError = lookupString(record, JOBS.BUILD_ERROR)
    const brief = lookupString(record, JOBS.BUILD_BRIEF_YAML) || ''

    const parsedData = brief ? parseBriefData(brief) : {}

    return {
      id: record.id,
      jobId,
      title,
      description,
      stage: mapStage(stageRaw),
      status: mapBuildStatusFromStage(stageRaw),
      template: parsedData.template ?? ('unknown' as const),
      buildStarted,
      buildCompleted,
      buildDuration,
      prototypeUrl,
      buildError,
      createdAt,
    }
  })
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
 * Derive build status from the Jobs Pipeline stage.
 * (Status Lookup field not available — infer from stage.)
 */
function mapBuildStatusFromStage(stage: string): Build['status'] {
  if (stage.includes('Deployed')) return 'completed'
  if (stage.includes('Failed')) return 'failed'
  return 'building'
}
