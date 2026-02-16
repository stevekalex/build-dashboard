/**
 * Job Pulse API Client
 *
 * This module provides functions to interact with the Job Pulse API.
 * According to the architecture (MANUAL_APPROVAL_FEATURE.md):
 * - Control Panel calls Job Pulse API (NOT Ralph directly)
 * - Job Pulse acts as proxy: fetches brief from Airtable → calls Ralph
 */

// Ensure URL has protocol prefix
const rawUrl = process.env.NEXT_PUBLIC_JOB_PULSE_URL!
const JOB_PULSE_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

export interface TriggerBuildResponse {
  success: boolean
  message?: string
}

export interface RejectBuildResponse {
  success: boolean
  message?: string
}

/**
 * Trigger a build for an approved brief
 *
 * Endpoint: POST /api/builds/trigger/:jobId
 * This calls Job Pulse, which then:
 * 1. Fetches brief from Airtable
 * 2. Updates Airtable stage to "✅ Approved"
 * 3. Calls Ralph's /api/build/start/:jobId
 */
export async function triggerBuild(
  jobId: string,
  approvedBy: string,
  notes?: string
): Promise<TriggerBuildResponse> {
  try {
    const response = await fetch(`${JOB_PULSE_URL}/api/builds/trigger/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: approvedBy, notes }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true, message: 'Build triggered successfully' }
  } catch (error) {
    console.error('Failed to trigger build:', error)
    throw error
  }
}

/**
 * Reject a brief with a reason
 *
 * Endpoint: POST /api/builds/reject/:jobId
 * This calls Job Pulse, which then:
 * 1. Updates Jobs Pipeline stage to "🚫 Rejected"
 * 2. Stores rejection reason
 */
export async function rejectBuild(
  jobId: string,
  reason: string,
  rejectedBy: string,
  notes?: string
): Promise<RejectBuildResponse> {
  try {
    const response = await fetch(`${JOB_PULSE_URL}/api/builds/reject/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, rejected_by: rejectedBy, notes }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true, message: 'Build rejected successfully' }
  } catch (error) {
    console.error('Failed to reject build:', error)
    throw error
  }
}
