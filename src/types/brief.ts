export interface Brief {
  id: string // Airtable record ID
  jobId: string // rec + 14 chars
  title: string // Job Title
  description: string // Job Description
  template: 'dashboard' | 'web_app' | 'unknown'
  buildable: boolean
  brief: string // Full YAML brief
  routes?: any[] // Parsed from brief
  uniqueInteractions?: string
  createdAt: string
  status: 'pending' | 'approved' | 'building' | 'complete' | 'failed'
}

export interface BuildDetails {
  buildable: boolean
  brief: string
  template: string
  status: string
}
