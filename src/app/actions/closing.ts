'use server'

import { revalidateTag } from 'next/cache'
import { updateJobField, updateJobStage } from '@/lib/airtable-mutations'
import { JOBS, STAGES } from '@/lib/airtable-fields'
import { captureError } from '@/lib/sentry'

/**
 * Mark a contract as sent for a deal.
 * Stamps Contract Sent Date with the current datetime.
 */
export async function markContractSent(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    await updateJobField(jobId, {
      [JOBS.CONTRACT_SENT_DATE]: now,
    })

    revalidateTag('jobs-closing', 'dashboard')
    return { success: true }
  } catch (error) {
    captureError(error, { action: 'markContractSent', jobId })
    console.error('markContractSent failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Mark a deal as lost.
 * Sets Lost Reason and updates Stage to Closed Lost.
 */
export async function markLost(
  jobId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateJobStage(jobId, STAGES.CLOSED_LOST, {
      [JOBS.LOST_REASON]: reason,
    })

    revalidateTag('jobs-closing', 'dashboard')
    return { success: true }
  } catch (error) {
    captureError(error, { action: 'markLost', jobId })
    console.error('markLost failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
