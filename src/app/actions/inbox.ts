'use server'

import { revalidatePath } from 'next/cache'
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
): Promise<void> {
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

  revalidatePath('/inbox')
}

/**
 * Mark a job as followed up. Advances the stage to the next touchpoint.
 * Stamps Last Follow Up Date. Sets Next Action Date to 3 days from now
 * (except when closing as lost).
 */
export async function markFollowedUp(jobId: string): Promise<void> {
  const base = getBase()
  const record = await base(TABLES.JOBS_PIPELINE).find(jobId)
  const currentStage = record.get(JOBS.STAGE) as string

  const nextStage = TOUCHPOINT_PROGRESSION[currentStage]
  if (!nextStage) {
    throw new Error(`No progression defined for stage: ${currentStage}`)
  }

  const now = new Date().toISOString()
  const additionalFields: Record<string, any> = {
    [JOBS.LAST_FOLLOW_UP_DATE]: now,
  }

  // Only set Next Action Date if not closing as lost
  if (nextStage !== STAGES.CLOSED_LOST) {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    additionalFields[JOBS.NEXT_ACTION_DATE] = threeDaysFromNow.toISOString()
  }

  await updateJobStage(jobId, nextStage, additionalFields)

  revalidatePath('/inbox')
}

/**
 * Close a job as lost due to no response.
 */
export async function closeNoResponse(jobId: string): Promise<void> {
  await updateJobStage(jobId, STAGES.CLOSED_LOST, {
    [JOBS.LOST_REASON]: 'No response',
  })

  revalidatePath('/inbox')
}

/**
 * Mark a call as completed for a job.
 */
export async function markCallDone(jobId: string, notes?: string): Promise<void> {
  const now = new Date().toISOString()
  await updateJobField(jobId, {
    [JOBS.CALL_COMPLETED_DATE]: now,
  })

  revalidatePath('/inbox')
}

/**
 * Mark a contract as signed (closed won).
 * Stamps Close Date, sets Deal Value, updates stage to Closed Won.
 */
export async function markContractSigned(
  jobId: string,
  dealValue: number
): Promise<void> {
  const now = new Date().toISOString()
  await updateJobStage(jobId, STAGES.CLOSED_WON, {
    [JOBS.CLOSE_DATE]: now,
    [JOBS.DEAL_VALUE]: dealValue,
  })

  revalidatePath('/inbox')
}
