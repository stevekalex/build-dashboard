'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { updateJobField, updateJobStage } from '@/lib/airtable-mutations'
import { getBase } from '@/lib/airtable'
import {
  TABLES,
  JOBS,
  STAGES,
  TOUCHPOINT_PROGRESSION,
  HOT_LEAD_TYPES,
  type ResponseType,
} from '@/lib/airtable-fields'

/**
 * Log a client response on a job.
 * Stamps Response Date, sets Response Type.
 * If the response type is a hot lead type, updates stage to Light Engagement.
 */
export async function logResponse(
  jobId: string,
  responseType: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    const fields: Record<string, any> = {
      [JOBS.RESPONSE_DATE]: now,
      [JOBS.RESPONSE_TYPE]: responseType,
    }

    if (HOT_LEAD_TYPES.includes(responseType as ResponseType)) {
      await updateJobStage(jobId, STAGES.LIGHT_ENGAGEMENT, fields)
    } else {
      await updateJobField(jobId, fields)
    }

    revalidateTag('jobs-inbox', 'dashboard')
    return { success: true }
  } catch (error) {
    console.error('logResponse failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log response',
    }
  }
}

/**
 * Mark a job as followed up. Advances the stage to the next touchpoint.
 * Stamps Last Follow Up Date. Sets Next Action Date to 3 days from now
 * (except when closing as lost).
 */
export async function markFollowedUp(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = getBase()
    const record = await base(TABLES.JOBS_PIPELINE).find(jobId)
    const currentStage = record.get(JOBS.STAGE) as string

    const nextStage = TOUCHPOINT_PROGRESSION[currentStage]
    if (!nextStage) {
      return {
        success: false,
        error: `No progression defined for stage: ${currentStage}`,
      }
    }

    const additionalFields: Record<string, any> = {}

    // Only set Next Action Date if not closing as lost
    if (nextStage !== STAGES.CLOSED_LOST) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      additionalFields[JOBS.NEXT_ACTION_DATE] = tomorrow.toISOString()
    }

    await updateJobStage(jobId, nextStage, Object.keys(additionalFields).length > 0 ? additionalFields : undefined)

    revalidateTag('jobs-inbox', 'dashboard')
    return { success: true }
  } catch (error) {
    console.error('markFollowedUp failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as followed up',
    }
  }
}

/**
 * Close a job as lost due to no response.
 */
export async function closeNoResponse(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateJobStage(jobId, STAGES.CLOSED_LOST)

    revalidateTag('jobs-inbox', 'dashboard')
    return { success: true }
  } catch (error) {
    console.error('closeNoResponse failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close job',
    }
  }
}

/**
 * Mark a call as completed for a job.
 */
export async function markCallDone(
  jobId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    await updateJobField(jobId, {
      [JOBS.CALL_COMPLETED_DATE]: now,
    })

    revalidateTag('jobs-inbox', 'dashboard')
    return { success: true }
  } catch (error) {
    console.error('markCallDone failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark call done',
    }
  }
}

/**
 * Mark a contract as signed (closed won).
 * Stamps Close Date, sets Deal Value, updates stage to Closed Won.
 */
export async function markContractSigned(
  jobId: string,
  dealValue: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    await updateJobStage(jobId, STAGES.CLOSED_WON, {
      [JOBS.CLOSE_DATE]: now,
      [JOBS.DEAL_VALUE]: dealValue,
    })

    revalidateTag('jobs-inbox', 'dashboard')
    return { success: true }
  } catch (error) {
    console.error('markContractSigned failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark contract signed',
    }
  }
}
