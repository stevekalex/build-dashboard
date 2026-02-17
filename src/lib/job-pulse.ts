/**
 * Job Pulse API Client
 *
 * This module provides functions to interact with the Job Pulse API.
 * According to the architecture (MANUAL_APPROVAL_FEATURE.md):
 * - Control Panel calls Job Pulse API (NOT Ralph directly)
 * - Job Pulse acts as proxy: fetches brief from Airtable → calls Ralph
 */

// Ensure URL has protocol prefix
const rawUrl = process.env.NEXT_PUBLIC_JOB_PULSE_URL || ''
const JOB_PULSE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

/**
 * Job Pulse API error codes — mirrors ERROR_CODES from Job Pulse constants.
 * Used for machine-readable error matching instead of string comparison.
 */
export const JP_ERROR_CODES = {
  WRONG_STAGE: 'WRONG_STAGE',
  NOT_BUILDABLE: 'NOT_BUILDABLE',
  INVALID_BRIEF: 'INVALID_BRIEF',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  BUILD_DETAILS_NOT_FOUND: 'BUILD_DETAILS_NOT_FOUND',
  INVALID_JOB_ID: 'INVALID_JOB_ID',
  MISSING_FIELD: 'MISSING_FIELD',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type JpErrorCode = typeof JP_ERROR_CODES[keyof typeof JP_ERROR_CODES]

/**
 * Error thrown by Job Pulse client with structured code and HTTP status.
 */
export class JobPulseError extends Error {
  code: JpErrorCode | 'UNKNOWN'
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'JobPulseError'
    this.status = status
    this.code = isKnownCode(code) ? code : 'UNKNOWN'
  }
}

function isKnownCode(code: string): code is JpErrorCode {
  return Object.values(JP_ERROR_CODES).includes(code as JpErrorCode)
}

/**
 * Parse a non-ok Job Pulse response into a JobPulseError.
 * Job Pulse returns { error: CODE, message: string } on failure.
 */
async function parseErrorResponse(response: Response): Promise<JobPulseError> {
  const text = await response.text()
  try {
    const body = JSON.parse(text)
    return new JobPulseError(
      response.status,
      body.error || 'UNKNOWN',
      body.message || `HTTP ${response.status}`
    )
  } catch {
    return new JobPulseError(response.status, 'UNKNOWN', text.slice(0, 200) || `HTTP ${response.status}`)
  }
}

/**
 * Trigger a build for an approved brief
 *
 * Endpoint: POST /api/builds/trigger/:jobId
 * This calls Job Pulse, which then:
 * 1. Fetches brief from Airtable
 * 2. Updates Airtable stage to "✅ Approved"
 * 3. Calls Ralph's /api/build/start/:jobId
 *
 * Throws JobPulseError with code/status on failure.
 */
export async function triggerBuild(
  jobId: string,
  approvedBy: string,
  notes?: string
): Promise<{ success: true; message: string }> {
  const response = await fetch(`${JOB_PULSE_URL}/api/builds/trigger/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy, notes }),
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return { success: true, message: 'Build triggered successfully' }
}

/**
 * Reject a brief with a reason
 *
 * Endpoint: POST /api/builds/reject/:jobId
 * This calls Job Pulse, which then:
 * 1. Updates Jobs Pipeline stage to "🚫 Rejected"
 * 2. Stores rejection reason
 *
 * Throws JobPulseError with code/status on failure.
 */
export async function rejectBuild(
  jobId: string,
  reason: string,
  rejectedBy: string,
  notes?: string
): Promise<{ success: true; message: string }> {
  const response = await fetch(`${JOB_PULSE_URL}/api/builds/reject/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, rejected_by: rejectedBy, notes }),
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return { success: true, message: 'Build rejected successfully' }
}
