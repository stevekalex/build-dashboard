'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { triggerBuild, rejectBuild, JobPulseError } from '@/lib/job-pulse'
import { updateJobField } from '@/lib/airtable-mutations'
import { JOBS } from '@/lib/airtable-fields'

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
 * Server Action: Approve a brief and trigger build
 *
 * 1. Gets user from session cookie
 * 2. Calls Job Pulse API to trigger the build
 * 3. Stamps Approved Date on Airtable
 * 4. Revalidates /approve path
 */
export async function approveBrief(
  jobId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const userName = await getUserName()
    await triggerBuild(jobId, userName, notes)

    // Stamp Decision Date — non-fatal if field doesn't exist yet in Airtable
    try {
      await updateJobField(jobId, {
        [JOBS.APPROVED_DATE]: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('Could not stamp Decision Date (field may not exist yet):', error instanceof Error ? error.message : error)
    }

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to approve brief:', error)
    const message = error instanceof Error ? error.message : 'Failed to approve brief'
    const code = error instanceof JobPulseError ? error.code : undefined
    return { success: false, error: message, code }
  }
}

/**
 * Server Action: Reject a brief with a reason
 *
 * 1. Gets user from session cookie
 * 2. Calls Job Pulse API to reject the brief
 * 3. Revalidates /approve path
 */
export async function rejectBrief(
  jobId: string,
  reason: string,
  notes?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const userName = await getUserName()
    await rejectBuild(jobId, reason, userName, notes)

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to reject brief:', error)
    const message = error instanceof Error ? error.message : 'Failed to reject brief'
    const code = error instanceof JobPulseError ? error.code : undefined
    return { success: false, error: message, code }
  }
}
