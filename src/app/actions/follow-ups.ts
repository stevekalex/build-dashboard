'use server'

import { getBase } from '@/lib/airtable'
import { TABLES, JOBS, STAGES } from '@/lib/airtable-fields'
import { generateText } from '@/lib/ai'
import { buildPromptForStage } from '@/lib/follow-up-prompts'

const VALID_STAGES = [
  STAGES.INITIAL_MESSAGE_SENT,
  STAGES.TOUCHPOINT_1,
  STAGES.TOUCHPOINT_2,
] as const

/**
 * Generate an AI follow-up message for a job at a given stage.
 * Only valid for stages that need a message (not Touchpoint 3).
 */
export async function generateFollowUpMessage(
  jobId: string,
  stage: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Guard: only allow stages that need AI messages
  if (!VALID_STAGES.includes(stage as any)) {
    return {
      success: false,
      error: `No AI message needed for stage: ${stage}`,
    }
  }

  try {
    const base = getBase()
    const record = await base(TABLES.JOBS_PIPELINE).find(jobId)

    const job = {
      id: record.id,
      jobId: (record.get('Job ID') as string) || record.id,
      title: (record.get(JOBS.JOB_TITLE) as string) || 'Untitled Job',
      description: (record.get(JOBS.JOB_DESCRIPTION) as string) || '',
      stage: (record.get(JOBS.STAGE) as string) || '',
      scrapedAt: (record.get(JOBS.SCRAPED_AT) as string) || '',
      loomUrl: (record.get(JOBS.LOOM_URL) as string) || undefined,
      client: (record.get(JOBS.CLIENT) as string) || undefined,
      aiLoomOutline: (record.get(JOBS.AI_LOOM_OUTLINE) as string) || undefined,
    }

    const { system, user } = buildPromptForStage(job, stage)
    const raw = await generateText(user, system)

    // Deterministic URL replacement — model outputs placeholders, we inject real URLs
    const neetoCalLink = process.env.NEETO_CAL_LINK || ''
    const message = raw
      .replace(/\{\{LOOM_URL\}\}/g, job.loomUrl || '')
      .replace(/\{\{NEETOCAL_LINK\}\}/g, neetoCalLink)

    return { success: true, message }
  } catch (error) {
    console.error('generateFollowUpMessage failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate message',
    }
  }
}
