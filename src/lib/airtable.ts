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

  // Fetch all briefs with their Build Details
  const briefs = await Promise.all(
    records.map(async (record) => {
      // Get linked Build Details record IDs
      const buildDetailsIds = record.get('Build Details') as string[] | null
      const buildDetailsId = buildDetailsIds && buildDetailsIds.length > 0 ? buildDetailsIds[0] : null

      // Fetch the actual Build Details record if it exists
      let buildData: any = null
      if (buildDetailsId) {
        try {
          const buildDetailsRecord = await base('Build Details').find(buildDetailsId)
          buildData = buildDetailsRecord.fields

          // DEBUG: Log the fetched build details
          console.log('=== AIRTABLE DEBUG ===')
          console.log('Record ID:', record.id)
          console.log('Build Details ID:', buildDetailsId)
          console.log('Build Data keys:', buildData ? Object.keys(buildData) : 'null')
          console.log('Raw buildData:', buildData)
        } catch (error) {
          console.error('Failed to fetch Build Details:', error)
        }
      }

      // Extract data with fallbacks
      const jobId = (record.get('Job ID') as string) || record.id
      const title = (record.get('Job Title') as string) || 'Untitled Job'
      const description = (record.get('Job Description') as string) || ''
      const createdAt = new Date().toISOString() // TODO: Find correct Airtable field name

      // Extract build details
      const buildable = buildData?.Buildable ?? false
      const brief = (buildData?.[`Brief YAML`] as string) || '' // Note: field name is "Brief YAML"
      const status = (buildData?.Status as string) || 'pending'

      // DEBUG: Log extracted values
      console.log('Extracted buildable:', buildable, '(type:', typeof buildable, ')')
      console.log('Extracted brief length:', brief.length)
      console.log('Extracted status:', status)
      console.log('=== END DEBUG ===\n')

      // Parse brief JSON/YAML for routes, template, and unique interactions
      const parsedData = brief ? parseBriefData(brief) : {}

      return {
        id: record.id,
        jobId,
        title,
        description,
        template: parsedData.template || 'unknown',
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
    // Try parsing as JSON first (since Airtable stores it as JSON string)
    let parsed: any
    try {
      parsed = JSON.parse(briefData)
    } catch {
      // Fallback to YAML parsing
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
