import { STAGES } from '@/lib/airtable-fields'
import { Job } from '@/types/brief'

/**
 * Build a stage-appropriate AI prompt for generating a follow-up message.
 *
 * Message 2 (Initial Message Sent → Touchpoint 1): Re-surface the Loom with a different hook
 * Message 3 (Touchpoint 1 → Touchpoint 2): Bridge prototype to full project + NeetoCal link
 * Message 4 (Touchpoint 2 → Touchpoint 3): Offer to adjust the prototype
 *
 * Touchpoint 3 does not need a message (just close as lost), so it throws.
 */
export function buildPromptForStage(job: Job, stage: string, neetoCalLink: string): string {
  const jobContext = `
Job title: ${job.title}
Job description: ${job.description}
${job.loomUrl ? `Loom video URL: ${job.loomUrl}` : 'No Loom video URL available.'}
${job.client ? `Client name: ${job.client}` : ''}
`.trim()

  switch (stage) {
    case STAGES.INITIAL_MESSAGE_SENT:
      return `You are writing a short Upwork follow-up message (Message 2 in a 3-message sequence).

Context:
${jobContext}

Goal: Re-surface the Loom video with a different hook than the original message. The client hasn't responded to the first message yet.

Rules:
- Maximum 2-3 lines. Be extremely concise.
- Reference the Loom video URL if available.
- Use a casual, friendly tone. No corporate speak.
- Do NOT use phrases like "just following up", "circling back", "touching base", or "I wanted to reach out".
- Do NOT include a subject line. Just the message body.
- Do NOT include any greeting like "Hi [name]" - start directly with the message.
- Output ONLY the message text, nothing else.`

    case STAGES.TOUCHPOINT_1:
      return `You are writing a short Upwork follow-up message (Message 3 in a 3-message sequence).

Context:
${jobContext}

NeetoCal booking link: ${neetoCalLink}

Goal: Bridge the prototype to a full project conversation. Include the NeetoCal link for booking a quick call.

Rules:
- Maximum 3-4 lines. Be concise.
- Mention the prototype/Loom briefly but pivot to discussing the full project.
- Include the NeetoCal link naturally in the message.
- Use a casual, friendly tone. No corporate speak.
- Do NOT use phrases like "just following up", "circling back", "touching base", or "I wanted to reach out".
- Do NOT include a subject line. Just the message body.
- Do NOT include any greeting like "Hi [name]" - start directly with the message.
- Output ONLY the message text, nothing else.`

    case STAGES.TOUCHPOINT_2:
      return `You are writing a short Upwork follow-up message (Message 4 — the final follow-up before closing).

Context:
${jobContext}

Goal: Offer to adjust the prototype based on their needs. This is a soft final attempt before closing the lead.

Rules:
- Maximum 2-3 lines. Be extremely concise.
- Offer to tweak or adjust the prototype to better fit their needs.
- Keep it low-pressure — this is the last message before closing as no-response.
- Use a casual, friendly tone. No corporate speak.
- Do NOT use phrases like "just following up", "circling back", "touching base", or "I wanted to reach out".
- Do NOT include a subject line. Just the message body.
- Do NOT include any greeting like "Hi [name]" - start directly with the message.
- Output ONLY the message text, nothing else.`

    case STAGES.TOUCHPOINT_3:
      throw new Error('Touchpoint 3 does not need an AI-generated message — just close as lost.')

    default:
      throw new Error(`No follow-up prompt defined for stage: ${stage}`)
  }
}
