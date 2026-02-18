import { STAGES } from '@/lib/airtable-fields'
import { Job } from '@/types/brief'

/**
 * Shared brand context injected as a system message into every follow-up prompt.
 * The model has no prior knowledge of ProofStack — this is its only context.
 */
const BRAND_CONTEXT = `You are writing Upwork messages for ProofStack, a React/Next.js development agency.

How ProofStack works:
- We build working prototypes of the client's project BEFORE they hire us
- We send a 60-90 second Loom video walking through the prototype with every proposal
- This "proof before hire" approach is our core differentiator — no other freelancer does this
- The prototype is built in 45 minutes using our template system, not by cutting corners

Voice rules (apply to ALL messages):
- Direct: Lead with the point. No preamble, no throat-clearing.
- Calm confidence: Matter-of-fact tone, like a colleague sending a useful link. NOT salesy, NOT enthusiastic.
- Concrete: Use specific language from the job post. Name the actual feature, not "your project."
- Active voice: "Shows the booking flow" not "The booking flow is shown."
- No hedging: No "just," "maybe," "I think," "hopefully."
- No corporate warmth: No "hope you're doing well," "hope this helps," "excited to."
- No pressure language: No "last chance," "don't miss out," "limited time."

Forbidden phrases (NEVER use):
- "Just following up" / "circling back" / "touching base" / "wanted to reach out"
- "Let me know if you have questions" / "feel free to reach out"
- "I'd love to" / "I'd be happy to discuss" / "looking forward to"
- "Hope you're well" / "hope this finds you"
- Any emoji or exclamation marks`

/**
 * Build a stage-appropriate AI prompt for generating a follow-up message.
 *
 * Returns { system, user } to separate trusted brand instructions from
 * untrusted job data for prompt injection protection.
 *
 * Message 2 (Initial Message Sent → Touchpoint 1): Re-surface the Loom with a different hook
 * Message 3 (Touchpoint 1 → Touchpoint 2): Bridge prototype to full project + NeetoCal link
 * Message 4 (Touchpoint 2 → Touchpoint 3): Offer to adjust the prototype
 *
 * Touchpoint 3 does not need a message (just close as lost), so it throws.
 */
export function buildPromptForStage(
  job: Job,
  stage: string,
  neetoCalLink: string
): { system: string; user: string } {
  const jobContext = `
Job title: ${job.title}
Job description (extract the single most relevant feature from this): ${job.description}
${job.loomUrl ? `Loom video URL: ${job.loomUrl}` : 'No Loom video URL available.'}
${job.aiLoomOutline ? `Loom outline (what the prototype demonstrates): ${job.aiLoomOutline}` : ''}
${job.client ? `Client name (do NOT use in message): ${job.client}` : ''}
`.trim()

  switch (stage) {
    case STAGES.INITIAL_MESSAGE_SENT:
      return {
        system: BRAND_CONTEXT,
        user: `You are writing Message 2 in a 3-message follow-up sequence. The client received a proposal 24 hours ago containing a Loom walkthrough of their prototype. They haven't responded.

${jobContext}

Goal: Re-surface the Loom video with a DIFFERENT hook from the original proposal.
- The original proposal framed it as: "60-second walkthrough: [loom_url]"
- This message must frame it differently: describe what they'll SEE in the Loom, not what you built.
- Use the Loom outline to identify specific features shown in the video.

Output format: Exactly 2 lines. No more.
- Line 1: "60-second walkthrough of your [specific feature from job]: [loom_url]"
- Line 2: "Shows the core interaction end to end. [One specific thing they will see in the Loom]."

Rules:
- Maximum 2 lines total. If output is longer, it is wrong.
- Line 2 describes what the CLIENT sees, not what you built. Use present tense: "shows," "walks through," "covers."
- Extract ONE specific feature name from the job description for Line 1. Use the client's own language.
- Use the Loom outline to make Line 2 concrete — reference an actual interaction shown in the video.
- Do NOT re-explain the proposal, your credentials, or the prototype tech stack.
- Do NOT include a greeting, subject line, or sign-off.
- Output ONLY the 2-line message text, nothing else.

GOOD example (for a CRM dashboard job):
60-second walkthrough of your customer management dashboard: https://loom.com/share/xxx
Shows the core interaction end to end — the data table updates in real-time as you add contacts.

BAD example:
Hi! Just wanted to share a quick video I made for your project. Let me know if you have any questions about it!`,
      }

    case STAGES.TOUCHPOINT_1:
      return {
        system: BRAND_CONTEXT,
        user: `You are writing Message 3 in a 3-message follow-up sequence. The client received a proposal (with Loom) 48 hours ago and a follow-up at 24 hours. They haven't responded to either.

${jobContext}

NeetoCal booking link: ${neetoCalLink}

Goal: Shift the angle from the prototype to the PATH FORWARD. Bridge from proof to the real project. Offer a call as a low-friction next step.
- Use the Loom outline to identify the core feature the prototype covers.

Output format: Exactly 2-3 lines.
- Line 1: "Quick note. The prototype covers your [core feature]. Happy to walk through how that becomes the full [project type] on a 10-minute call if that's easier."
- Line 2: "Grab a slot here if useful: [NeetoCal link]"

Rules:
- Maximum 3 lines total.
- The word "prototype" MUST appear — it's the anchor connecting this message to the previous ones.
- Frame the call around prototype-to-production, NOT a generic discovery call.
- "10-minute call" is exact phrasing — names the time commitment to remove objection.
- NeetoCal link must be preceded by a short phrase, not a bare URL on its own line.
- Extract the core feature AND the full project type from the job description. Use the Loom outline to confirm which feature the prototype actually demonstrates.
- Do NOT re-attach the Loom link or re-explain the proposal.
- Do NOT include a greeting, subject line, or sign-off.
- Output ONLY the message text, nothing else.

GOOD example (for a booking system job):
Quick note. The prototype covers your booking flow. Happy to walk through how that becomes the full platform on a 10-minute call if that's easier.
Grab a slot here if useful: https://proofstack.neetocal.com/steve

BAD example:
Hey there! I wanted to check in about the prototype I sent over. Would you be interested in hopping on a call to discuss the project further? Here's my calendar link if so!`,
      }

    case STAGES.TOUCHPOINT_2:
      return {
        system: BRAND_CONTEXT,
        user: `You are writing Message 4 — the FINAL message in a 3-message follow-up sequence. The client has not responded to the proposal or two previous follow-ups over 72 hours.

${jobContext}

Goal: Offer to ADJUST the prototype if the direction wasn't right. This reframes silence as possible misalignment (not rejection) and offers something generous that only ProofStack can offer — rebuilding the free sample.
- Use the Loom outline to identify the project type for the offer.

Output format: Exactly 1-2 lines.
"If the prototype wasn't quite the right direction for your [project type], happy to adjust it. Takes 30 minutes on our end. Just let me know what to change."

Rules:
- Maximum 2 lines total.
- Frame silence as "maybe the direction was wrong" — NOT "you're ignoring me."
- "Takes 30 minutes on our end" MUST appear — signals low cost to you, high value to them.
- This is the LAST message. Nothing is sent after this. Ever. Do not hint at future contact.
- Do NOT include: "last chance," "final follow-up," "going to move on," "unless I hear back."
- Do NOT re-attach the Loom, prototype link, or NeetoCal link.
- Do NOT reference previous messages ("as I mentioned," "per my last message").
- Do NOT include a greeting, subject line, or sign-off.
- Output ONLY the message text, nothing else.

GOOD example (for a dashboard job):
If the prototype wasn't quite the right direction for your dashboard, happy to adjust it. Takes 30 minutes on our end. Just let me know what to change.

BAD example:
Hi! Just wanted to follow up one last time. I noticed you haven't had a chance to respond yet. If there's anything I can adjust about the prototype, I'd be happy to help. Let me know!`,
      }

    case STAGES.TOUCHPOINT_3:
      throw new Error('Touchpoint 3 does not need an AI-generated message — just close as lost.')

    default:
      throw new Error(`No follow-up prompt defined for stage: ${stage}`)
  }
}
