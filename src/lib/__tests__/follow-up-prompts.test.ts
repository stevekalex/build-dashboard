import { describe, it, expect } from 'vitest'
import { buildPromptForStage } from '../follow-up-prompts'
import { STAGES } from '@/lib/airtable-fields'
import { Job } from '@/types/brief'

const mockJob: Job = {
  id: 'rec1',
  jobId: 'job1',
  title: 'Build a CRM Dashboard',
  description: 'Need a React dashboard with analytics and user management.',
  stage: '💌 Initial message sent',
  scrapedAt: '2026-02-10T10:00:00Z',
  loomUrl: 'https://www.loom.com/share/abc123',
  client: 'John Smith',
}

const neetoCalLink = 'https://cal.neeto.com/steve/30min'

describe('buildPromptForStage', () => {
  it('should build a prompt for Initial Message Sent (message 2 - Loom re-surface)', () => {
    const prompt = buildPromptForStage(mockJob, STAGES.INITIAL_MESSAGE_SENT, neetoCalLink)

    expect(prompt).toContain('Build a CRM Dashboard')
    expect(prompt).toContain('https://www.loom.com/share/abc123')
    expect(prompt).toContain('2') // should mention short/2 lines
  })

  it('should build a prompt for Touchpoint 1 (message 3 - bridge to full project)', () => {
    const prompt = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_1, neetoCalLink)

    expect(prompt).toContain('Build a CRM Dashboard')
    expect(prompt).toContain(neetoCalLink)
  })

  it('should build a prompt for Touchpoint 2 (message 4 - offer to adjust)', () => {
    const prompt = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_2, neetoCalLink)

    expect(prompt).toContain('Build a CRM Dashboard')
  })

  it('should include job description in all prompts', () => {
    for (const stage of [STAGES.INITIAL_MESSAGE_SENT, STAGES.TOUCHPOINT_1, STAGES.TOUCHPOINT_2]) {
      const prompt = buildPromptForStage(mockJob, stage, neetoCalLink)
      expect(prompt).toContain('React dashboard with analytics')
    }
  })

  it('should throw for Touchpoint 3 (no AI message needed)', () => {
    expect(() => buildPromptForStage(mockJob, STAGES.TOUCHPOINT_3, neetoCalLink)).toThrow()
  })

  it('should throw for unknown stages', () => {
    expect(() => buildPromptForStage(mockJob, '🧐 Light Engagement', neetoCalLink)).toThrow()
  })

  it('should handle job without loom URL gracefully', () => {
    const jobNoLoom = { ...mockJob, loomUrl: undefined }
    const prompt = buildPromptForStage(jobNoLoom, STAGES.INITIAL_MESSAGE_SENT, neetoCalLink)

    // Should still produce a valid prompt
    expect(prompt).toContain('Build a CRM Dashboard')
  })
})
