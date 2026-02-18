'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { updateJobField, updateJobStage } from '@/lib/airtable-mutations'
import { JOBS, STAGES } from '@/lib/airtable-fields'

/**
 * Get the current user's name from session cookie
 */
async function getUserName(): Promise<string> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    return 'Unknown User'
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return session.name || 'Unknown User'
  } catch {
    return 'Unknown User'
  }
}

/**
 * Server Action: Save a Loom URL to a job record.
 */
export async function saveLoomUrl(
  jobId: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url || !url.trim()) {
      return { success: false, error: 'Loom URL cannot be empty' }
    }

    await updateJobField(jobId, {
      [JOBS.LOOM_URL]: url.trim(),
    })

    revalidateTag('jobs-ready-to-send', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to save Loom URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save Loom URL',
    }
  }
}

/**
 * Server Action: Mark a job as applied.
 * Stamps Applied At with current datetime and advances stage to "Touchpoint 1".
 */
export async function markApplied(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = await getUserName()

    console.log({
      action: 'mark_applied',
      jobId,
      appliedBy: userName,
      timestamp: new Date().toISOString(),
    })

    const now = new Date()
    const nextActionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await updateJobStage(jobId, STAGES.TOUCHPOINT_1, {
      [JOBS.APPLIED_AT]: now.toISOString(),
      [JOBS.NEXT_ACTION_DATE]: nextActionDate.toISOString(),
      [JOBS.LOOM_RECORDED_DATE]: now.toISOString(),
    })

    revalidateTag('jobs-ready-to-send', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to mark applied:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as applied',
    }
  }
}
