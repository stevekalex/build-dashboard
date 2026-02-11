import Airtable from 'airtable'
import yaml from 'js-yaml'
import { Brief } from '@/types/brief'

// Initialize Airtable client
function getBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY!,
  }).base(process.env.AIRTABLE_BASE_ID!)
}

/**
 * Fetch briefs that are pending approval from Airtable
 */
export async function getBriefsPendingApproval(): Promise<Brief[]> {
  const base = getBase()
  const records = await base('Jobs Pipeline')
    .select({
      filterByFormula: `{Stage} = "⏸️ Pending Approval"`,
    })
    .all()

  return records.map((record) => {
    // Get linked Build Details
    const buildDetails = record.get('Build Details') as any[] | null
    const buildData = buildDetails && buildDetails.length > 0 ? buildDetails[0].fields : null

    // Extract data with fallbacks
    const jobId = (record.get('Job ID') as string) || record.id
    const title = (record.get('Job Title') as string) || 'Untitled Job'
    const description = (record.get('Job Description') as string) || ''
    const createdAt = new Date().toISOString() // TODO: Find correct Airtable field name

    // Extract build details
    const buildable = buildData?.Buildable ?? false
    const brief = (buildData?.Brief as string) || ''
    const template = (buildData?.Template as string) || 'unknown'
    const status = (buildData?.Status as string) || 'pending'

    // Parse brief YAML for routes and unique interactions
    const parsedData = brief ? parseBriefData(brief) : {}

    return {
      id: record.id,
      jobId,
      title,
      description,
      template: template === 'dashboard' || template === 'web_app' ? template : 'unknown',
      buildable,
      brief,
      routes: parsedData.routes,
      uniqueInteractions: parsedData.uniqueInteractions,
      createdAt,
      status: mapStatus(status),
    }
  })
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
 * Parse YAML brief and extract routes and unique interactions
 */
function parseBriefData(briefYaml: string): { routes?: any[]; uniqueInteractions?: string } {
  try {
    const parsed = yaml.load(briefYaml) as any
    return {
      routes: parsed?.routes || parsed?.pages || [],
      uniqueInteractions: parsed?.unique_interactions || parsed?.uniqueInteractions || '',
    }
  } catch (error) {
    console.error('Failed to parse brief YAML:', error)
    return {}
  }
}
