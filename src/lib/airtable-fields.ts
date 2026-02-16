// ─── Table Names ───

export const TABLES = {
  JOBS_PIPELINE: 'Jobs Pipeline',
  BUILD_DETAILS: 'Build Details',
} as const

// ─── Jobs Pipeline Fields ───

export const JOBS = {
  // Core fields (exist)
  JOB_URL: 'Job URL',
  STAGE: 'Stage',
  POSTED_DATE: 'Posted Date',
  JOB_TITLE: 'Job Title',
  JOB_DESCRIPTION: 'Job Description',
  BUILD_DETAILS: 'Build Details',
  BUDGET_TYPE: 'Budget Type',
  BUDGET_AMOUNT: 'Budget Amount',
  BUDGET_RANGE: 'Budget Range',
  SKILLS: 'Skills',
  DURATION: 'Duration',
  SCRAPED_AT: 'Scraped At',
  SOURCE: 'Source',
  ASSIGNED_TO: 'Assigned To',
  VOLLNA_FILTER: 'Vollna Filter',
  CONNECTS_REQUIRED: 'Connects Required',
  // Content fields (exist)
  AI_COVER_LETTER: 'AI Cover Letter',
  AI_LOOM_OUTLINE: 'AI Loom Outline',
  PROTOTYPE_URL: 'Prototype URL',
  LOOM_URL: 'Loom URL',
  PROTOTYPE_STATUS: 'Prototype Status',
  // Application fields (exist)
  APPLIED_AT: 'Applied At',
  NEXT_ACTION_DATE: 'Next Action Date',
  CLOSE_DATE: 'Close Date',
  // New fields (to be created in Airtable)
  APPROVED_DATE: 'Approved Date',
  DEPLOYED_DATE: 'Deployed Date',
  LOOM_RECORDED_DATE: 'Loom Recorded Date',
  RESPONSE_DATE: 'Response Date',
  RESPONSE_TYPE: 'Response Type',
  CALL_COMPLETED_DATE: 'Call Completed Date',
  CONTRACT_SENT_DATE: 'Contract Sent Date',
  DEAL_VALUE: 'Deal Value',
  LOST_REASON: 'Lost Reason',
  CLIENT: 'Client',
  LAST_FOLLOW_UP_DATE: 'Last Follow Up Date',
} as const

// ─── Build Details Fields ───

export const BUILD = {
  NAME: 'Name',
  JOBS_PIPELINE: 'Jobs Pipeline',
  STATUS: 'Status',
  BUILDABLE: 'Buildable',
  BUILDABLE_REASONING: 'Buildable Reasoning',
  BRIEF_YAML: 'Brief YAML',
  PROTOTYPE_URL: 'Prototype URL',
  UNIQUE_INTERACTIONS: 'Unique Interactions',
  BUILD_DURATION: 'Build Duration',
  BUILD_STARTED: 'Build Started',
  BUILD_COMPLETED: 'Build Completed',
  BUILD_ERROR: 'Build Error',
  NOTES: 'Notes',
  DECISION_DATE: 'Decision Date',
  DECISION_MADE_BY: 'Decision Made By',
  REJECTION_REASON: 'Rejection Reason',
} as const

// ─── Stage Values ───

export const STAGES = {
  NEW: '🆕 New',
  PENDING_APPROVAL: '⏸️ Pending Approval',
  APPROVED: '✅ Approved',
  REJECTED: '🚫 Rejected',
  BUILD_FAILED: '⚠️ Build Failed',
  PROTOTYPE_BUILDING: '🔨 Prototype Building',
  PROTOTYPE_BUILT: '🎁 Prototype Built',
  SEND_LOOM: '🎥 Send Loom',
  DEPLOYED: '🏗️ Deployed',
  INITIAL_MESSAGE_SENT: '💌 Initial message sent',
  TOUCHPOINT_1: '📆 Touchpoint 1',
  TOUCHPOINT_2: '📆 Touchpoint 2',
  TOUCHPOINT_3: '📆 Touchpoint 3',
  LIGHT_ENGAGEMENT: '🧐 Light Engagement',
  ENGAGEMENT_WITH_PROTOTYPE: '🕺 Engagement with prototype',
  CLOSED_WON: '🏁 Closed Won',
  CLOSED_LOST: '➡️ Closed Lost',
} as const

// Stages where follow-ups happen
export const FOLLOW_UP_STAGES = [
  STAGES.INITIAL_MESSAGE_SENT,
  STAGES.TOUCHPOINT_1,
  STAGES.TOUCHPOINT_2,
  STAGES.TOUCHPOINT_3,
] as const

// Stages that mean "closed" (exclude from active views)
export const CLOSED_STAGES = [
  STAGES.CLOSED_WON,
  STAGES.CLOSED_LOST,
] as const

// Stages that mean "ready to send" (prototype done, not yet applied)
export const READY_TO_SEND_STAGES = [
  STAGES.DEPLOYED,
  STAGES.PROTOTYPE_BUILT,
] as const

// Stages with active engagement (for closing dashboard)
export const ENGAGEMENT_STAGES = [
  STAGES.LIGHT_ENGAGEMENT,
  STAGES.ENGAGEMENT_WITH_PROTOTYPE,
] as const

// Follow-up stage progression (for advancing to next touchpoint)
export const TOUCHPOINT_PROGRESSION: Record<string, string> = {
  [STAGES.INITIAL_MESSAGE_SENT]: STAGES.TOUCHPOINT_1,
  [STAGES.TOUCHPOINT_1]: STAGES.TOUCHPOINT_2,
  [STAGES.TOUCHPOINT_2]: STAGES.TOUCHPOINT_3,
  [STAGES.TOUCHPOINT_3]: STAGES.CLOSED_LOST, // after 3rd touchpoint, close as lost
}

// ─── Response Types ───

export const RESPONSE_TYPES = [
  'Message',
  'Shortlist',
  'Interview',
  'Hire',
  'Decline',
  'Hired Other',
] as const

export type ResponseType = (typeof RESPONSE_TYPES)[number]

export const HOT_LEAD_TYPES: ResponseType[] = ['Shortlist', 'Interview', 'Hire']

// ─── Build Detail Statuses ───

export const BUILD_STATUSES = {
  EVALUATED: 'Evaluated',
  UNBUILDABLE: 'Unbuildable',
  BUILDING: 'Building',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
} as const
