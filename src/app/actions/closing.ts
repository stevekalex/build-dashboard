'use server'

import { revalidatePath } from 'next/cache'
import { updateJobField, updateJobStage } from '@/lib/airtable-mutations'
import { JOBS, STAGES } from '@/lib/airtable-fields'

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

    revalidatePath('/closing')
    return { success: true }
  } catch (error) {
    console.error('markContractSent failed:', error)
    return { success: false, error: (error as Error).message }
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

    revalidatePath('/closing')
    return { success: true }
  } catch (error) {
    console.error('markLost failed:', error)
    return { success: false, error: (error as Error).message }
  }
}
