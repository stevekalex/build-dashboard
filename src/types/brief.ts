// ─── Legacy types (used by existing components during migration) ───

export interface Brief {
  id: string
  jobId: string
  title: string
  description: string
  template: 'dashboard' | 'web_app' | 'unknown'
  buildable: boolean
  brief: string
  routes?: any[]
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

export interface Build {
  id: string
  jobId: string
  title: string
  description: string
  stage: 'approved' | 'deployed' | 'failed'
  status: 'building' | 'completed' | 'failed' | 'evaluated'
  template?: 'dashboard' | 'web_app' | 'unknown'
  buildStarted?: string
  buildCompleted?: string
  buildDuration?: number
  prototypeUrl?: string
  buildError?: string
  createdAt: string
}

// ─── Unified Job type for the ops management system ───

export interface Job {
  id: string
  jobId: string
  title: string
  description: string
  stage: string
  scrapedAt: string
  // Build-related
  buildable?: boolean
  buildableReasoning?: string
  brief?: string
  template?: 'dashboard' | 'web_app' | 'unknown'
  routes?: any[]
  uniqueInteractions?: string
  prototypeUrl?: string
  buildStarted?: string
  buildCompleted?: string
  buildDuration?: number
  buildError?: string
  buildStatus?: string
  // Application-related
  appliedAt?: string
  loomUrl?: string
  loomRecordedDate?: string
  coverLetter?: string
  aiLoomOutline?: string
  jobUrl?: string
  budgetAmount?: number
  budgetType?: string
  client?: string
  skills?: string
  prototypeStatus?: string
  // Response/Sales
  responseDate?: string
  responseType?: string
  callCompletedDate?: string
  lastFollowUpDate?: string
  nextActionDate?: string
  // Closing
  contractSentDate?: string
  closeDate?: string
  dealValue?: number
  lostReason?: string
  // Dates
  approvedDate?: string
  deployedDate?: string
}

// ─── Daily Pulse metrics ───

export interface DailyMetrics {
  jobsDetected: number
  jobsApproved: number
  prototypesBuilt: number
  applicationsSent: number
  responsesReceived: number
  callsCompleted: number
  contractsSigned: number
  date: string
}

// ─── Pipeline stage counts ───

export interface PipelineCounts {
  new: number
  pendingApproval: number
  approved: number
  building: number
  deployed: number
  applied: number
  followUps: number
  engaging: number
  closedWon: number
  closedLost: number
  buildFailed: number
  rejected: number
}
