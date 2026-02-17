'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { triggerBuild, rejectBuild } from '@/lib/job-pulse'
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = await getUserName()
    await triggerBuild(jobId, userName, notes)
    await updateJobField(jobId, {
      [JOBS.APPROVED_DATE]: new Date().toISOString(),
    })

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to approve brief:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve brief',
    }
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = await getUserName()
    await rejectBuild(jobId, reason, userName, notes)

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to reject brief:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject brief',
    }
  }
}
