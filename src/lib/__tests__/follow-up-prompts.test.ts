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

describe('buildPromptForStage', () => {
  it('should build a prompt for Initial Message Sent (message 2 - Loom re-surface)', () => {
    const { system, user } = buildPromptForStage(mockJob, STAGES.INITIAL_MESSAGE_SENT)

    expect(system).toContain('ProofStack')
    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('2 lines')
    expect(user).toContain('journey')
  })

  it('should build a prompt for Touchpoint 1 (message 3 - bridge to full project)', () => {
    const { system, user } = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_1)

    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('{{NEETOCAL_LINK}}')
    expect(user).toContain('prototype')
  })

  it('should build a prompt for Touchpoint 2 (message 4 - offer to adjust)', () => {
    const { user } = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_2)

    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('30 minutes')
  })

  it('should include job description in all prompts', () => {
    for (const stage of [STAGES.INITIAL_MESSAGE_SENT, STAGES.TOUCHPOINT_1, STAGES.TOUCHPOINT_2]) {
      const { user } = buildPromptForStage(mockJob, stage)
      expect(user).toContain('React dashboard with analytics')
    }
  })

  it('should throw for Touchpoint 3 (no AI message needed)', () => {
    expect(() => buildPromptForStage(mockJob, STAGES.TOUCHPOINT_3)).toThrow()
  })

  it('should throw for unknown stages', () => {
    expect(() => buildPromptForStage(mockJob, '🧐 Light Engagement')).toThrow()
  })

  it('should handle job without loom URL gracefully', () => {
    const jobNoLoom = { ...mockJob, loomUrl: undefined }
    const { user } = buildPromptForStage(jobNoLoom, STAGES.INITIAL_MESSAGE_SENT)

    expect(user).toContain('Build a CRM Dashboard')
  })

  it('should not include aiLoomOutline in job context', () => {
    const jobWithOutline = { ...mockJob, aiLoomOutline: 'Shows dashboard with charts' }
    const { user } = buildPromptForStage(jobWithOutline, STAGES.INITIAL_MESSAGE_SENT)

    expect(user).not.toContain('Loom outline')
    expect(user).not.toContain('Shows dashboard with charts')
  })
})
