import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FollowUpCard } from '../follow-up-card'
import { Job } from '@/types/brief'

// Mock server actions
vi.mock('@/app/actions/inbox', () => ({
  markFollowedUp: vi.fn(),
  closeNoResponse: vi.fn(),
}))

vi.mock('@/app/actions/follow-ups', () => ({
  generateFollowUpMessage: vi.fn(),
}))

const mockJob: Job = {
  id: 'rec1',
  jobId: 'job1',
  title: 'CRM Dashboard Build',
  description: 'Build a CRM dashboard',
  stage: '📆 Touchpoint 1',
  scrapedAt: '2026-02-10T10:00:00Z',
  nextActionDate: '2026-02-12T10:00:00Z',
  budgetAmount: 500,
  budgetType: 'Fixed',
  client: 'Test Client',
  jobUrl: 'https://upwork.com/job/1',
}

const mockDismiss = vi.fn()

describe('FollowUpCard', () => {
  it('should render job title', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByText('CRM Dashboard Build')).toBeInTheDocument()
  })

  it('should render client name and budget', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.getByText(/\$500/)).toBeInTheDocument()
  })

  it('should render stage badge', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByText('📆 Touchpoint 1')).toBeInTheDocument()
  })

  it('should render Generate Message button for all columns', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByText('Generate Message')).toBeInTheDocument()
  })

  it('should render Generate Message button for closeOut column too', () => {
    const closeOutJob = { ...mockJob, stage: '📆 Touchpoint 3' }
    render(<FollowUpCard job={closeOutJob} column="closeOut" onDismiss={mockDismiss} />)
    expect(screen.getByText('Generate Message')).toBeInTheDocument()
  })

  it('should render Close No Response button for all columns', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByText('Close No Response')).toBeInTheDocument()
  })

  it('should render Close No Response button for closeOut column', () => {
    const closeOutJob = { ...mockJob, stage: '📆 Touchpoint 3' }
    render(<FollowUpCard job={closeOutJob} column="closeOut" onDismiss={mockDismiss} />)
    expect(screen.getByText('Close No Response')).toBeInTheDocument()
  })

  it('should render external link when jobUrl is present', () => {
    render(<FollowUpCard job={mockJob} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.getByTitle('Open on Upwork')).toBeInTheDocument()
  })

  it('should not render external link when jobUrl is absent', () => {
    const jobNoUrl = { ...mockJob, jobUrl: undefined }
    render(<FollowUpCard job={jobNoUrl} column="followUp1" onDismiss={mockDismiss} />)
    expect(screen.queryByTitle('Open on Upwork')).not.toBeInTheDocument()
  })
})
