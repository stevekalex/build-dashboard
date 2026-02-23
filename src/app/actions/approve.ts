'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { triggerBuild, rejectBuild, JobPulseError } from '@/lib/job-pulse'
import { updateJobStage } from '@/lib/airtable-mutations'
import { STAGES } from '@/lib/airtable-fields'
import { captureError } from '@/lib/sentry'

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
 * 2. Calls Job Pulse API to trigger the build (Job Pulse stamps Build Started)
 * 3. Revalidates /approve path
 */
export async function approveBrief(
  jobId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const userName = await getUserName()
    await triggerBuild(jobId, userName, notes)

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    captureError(error, { action: 'approveBrief', jobId })
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
    captureError(error, { action: 'rejectBrief', jobId })
    console.error('Failed to reject brief:', error)
    const message = error instanceof Error ? error.message : 'Failed to reject brief'
    const code = error instanceof JobPulseError ? error.code : undefined
    return { success: false, error: message, code }
  }
}

/**
 * Server Action: Mark a build as failed
 *
 * Moves the job from "🔨 Prototype Building" to "⚠️ Build Failed".
 * Used when a build is stuck or has errored out.
 */
export async function markBuildFailed(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateJobStage(jobId, STAGES.BUILD_FAILED)

    revalidateTag('jobs-approve', 'dashboard')
    revalidateTag('jobs-building', 'dashboard')

    return { success: true }
  } catch (error) {
    captureError(error, { action: 'markBuildFailed', jobId })
    console.error('Failed to mark build as failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to mark build as failed'
    return { success: false, error: message }
  }
}
