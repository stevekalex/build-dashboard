'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { triggerBuild, rejectBuild } from '@/lib/job-pulse'

/**
 * Get the current user's name from session
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
  } catch (error) {
    return 'Unknown User'
  }
}

/**
 * Server Action: Approve a brief and trigger build
 *
 * This action:
 * 1. Gets the current user's name from session
 * 2. Calls Job Pulse API to trigger the build
 * 3. Revalidates the dashboard page to show updated status
 */
export async function approveBrief(briefId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = await getUserName()
    await triggerBuild(briefId, userName)

    // Revalidate the dashboard to show updated status
    revalidatePath('/')
    revalidatePath(`/briefs/${briefId}`)

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
 * This action:
 * 1. Gets the current user's name from session
 * 2. Calls Job Pulse API to reject the brief
 * 3. Revalidates the dashboard page to remove the brief
 */
export async function rejectBriefAction(
  briefId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = await getUserName()
    await rejectBuild(briefId, reason, userName)

    // Revalidate the dashboard to remove the brief
    revalidatePath('/')
    revalidatePath(`/briefs/${briefId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to reject brief:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject brief',
    }
  }
}
