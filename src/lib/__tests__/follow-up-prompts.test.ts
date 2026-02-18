import { describe, it, expect } from 'vitest'
import { buildPromptForStage } from '../follow-up-prompts'
import { STAGES } from '@/lib/airtable-fields'
import { Job } from '@/types/brief'

const mockJob: Job = {
  id: 'rec1',
  jobId: 'job1',
  title: 'Build a CRM Dashboard',
  description: 'Need a React dashboard with analytics and user management.',
  stage: '📆 Touchpoint 1',
  scrapedAt: '2026-02-10T10:00:00Z',
  loomUrl: 'https://www.loom.com/share/abc123',
  client: 'John Smith',
}

describe('buildPromptForStage', () => {
  it('should build a prompt for Touchpoint 1 (follow-up 1 - Loom re-surface)', () => {
    const { system, user } = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_1)

    expect(system).toContain('ProofStack')
    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('2 lines')
    expect(user).toContain('journey')
  })

  it('should build a prompt for Touchpoint 2 (follow-up 2 - bridge to full project)', () => {
    const { system, user } = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_2)

    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('{{NEETOCAL_LINK}}')
    expect(user).toContain('prototype')
  })

  it('should build a prompt for Touchpoint 3 (follow-up 3 - offer to adjust)', () => {
    const { user } = buildPromptForStage(mockJob, STAGES.TOUCHPOINT_3)

    expect(user).toContain('Build a CRM Dashboard')
    expect(user).toContain('30 minutes')
  })

  it('should include job description in all prompts', () => {
    for (const stage of [STAGES.TOUCHPOINT_1, STAGES.TOUCHPOINT_2, STAGES.TOUCHPOINT_3]) {
      const { user } = buildPromptForStage(mockJob, stage)
      expect(user).toContain('React dashboard with analytics')
    }
  })

  it('should throw for unknown stages', () => {
    expect(() => buildPromptForStage(mockJob, '🧐 Light Engagement')).toThrow()
  })

  it('should handle job without loom URL gracefully', () => {
    const jobNoLoom = { ...mockJob, loomUrl: undefined }
    const { user } = buildPromptForStage(jobNoLoom, STAGES.TOUCHPOINT_1)

    expect(user).toContain('Build a CRM Dashboard')
  })

  it('should include aiLoomOutline in job context when present', () => {
    const jobWithOutline = { ...mockJob, aiLoomOutline: 'Shows dashboard with charts' }
    const { user } = buildPromptForStage(jobWithOutline, STAGES.TOUCHPOINT_1)

    expect(user).toContain('Loom outline')
    expect(user).toContain('Shows dashboard with charts')
  })
})
