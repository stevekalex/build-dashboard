import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SendCard } from '../send-card'
import { Job } from '@/types/brief'

// Mock server actions
vi.mock('@/app/actions/ready-to-send', () => ({
  saveLoomUrl: vi.fn().mockResolvedValue({ success: true }),
  markApplied: vi.fn().mockResolvedValue({ success: true }),
}))

const mockJob: Job = {
  id: 'rec123',
  jobId: 'recABC1234567890D',
  title: 'Build CRM Dashboard',
  description: 'Create a dashboard for managing customers',
  stage: '🏗️ Deployed',
  scrapedAt: '2026-02-10T10:00:00Z',
  prototypeUrl: 'https://proto.example.com',
  coverLetter: 'Dear hiring manager, I have built a prototype...',
  aiLoomOutline: 'Walk through the dashboard features...',
  jobUrl: 'https://upwork.com/jobs/123',
  loomUrl: undefined,
  budgetAmount: 500,
  budgetType: 'Fixed',
  skills: 'React, TypeScript, Next.js',
}

describe('SendCard - Happy Path', () => {
  it('should render job title', () => {
    render(<SendCard job={mockJob} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })

  it('should render budget information', () => {
    render(<SendCard job={mockJob} />)

    expect(screen.getByText(/\$500/)).toBeInTheDocument()
    expect(screen.getByText(/Fixed/i)).toBeInTheDocument()
  })

  it('should render Open Prototype link pointing to prototype URL', () => {
    render(<SendCard job={mockJob} />)

    const protoLink = screen.getByRole('link', { name: /open prototype/i })
    expect(protoLink).toHaveAttribute('href', 'https://proto.example.com')
    expect(protoLink).toHaveAttribute('target', '_blank')
  })

  it('should render Copy Cover Letter button', () => {
    render(<SendCard job={mockJob} />)

    expect(screen.getByRole('button', { name: /copy cover letter/i })).toBeInTheDocument()
  })

  it('should render Open Upwork link pointing to job URL', () => {
    render(<SendCard job={mockJob} />)

    const upworkLink = screen.getByRole('link', { name: /open upwork/i })
    expect(upworkLink).toHaveAttribute('href', 'https://upwork.com/jobs/123')
    expect(upworkLink).toHaveAttribute('target', '_blank')
  })

  it('should render Mark Applied button', () => {
    render(<SendCard job={mockJob} />)

    expect(screen.getByRole('button', { name: /mark applied/i })).toBeInTheDocument()
  })

  it('should render skills', () => {
    render(<SendCard job={mockJob} />)

    expect(screen.getByText(/React/)).toBeInTheDocument()
    expect(screen.getByText(/TypeScript/)).toBeInTheDocument()
  })

  it('should show step indicators', () => {
    render(<SendCard job={mockJob} />)

    // All 5 step numbers should be present
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    // Step labels should be present (using getAllByText since action buttons share label text)
    expect(screen.getAllByText(/open prototype/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/record loom/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/copy cover letter/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/open upwork/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/mark applied/i).length).toBeGreaterThanOrEqual(1)
  })
})

describe('SendCard - Edge Cases', () => {
  it('should disable Open Prototype when no prototype URL', () => {
    const jobWithoutProto = { ...mockJob, prototypeUrl: undefined }
    render(<SendCard job={jobWithoutProto} />)

    // Should not render as a link when disabled - no <a> element with "Open Prototype"
    expect(screen.queryByRole('link', { name: /open prototype/i })).not.toBeInTheDocument()
  })

  it('should show saved Loom URL with checkmark when loomUrl exists', () => {
    const jobWithLoom = { ...mockJob, loomUrl: 'https://loom.com/share/existing' }
    render(<SendCard job={jobWithLoom} />)

    expect(screen.getByText(/loom.com/i)).toBeInTheDocument()
  })

  it('should handle missing cover letter', () => {
    const jobWithoutCover = { ...mockJob, coverLetter: undefined }
    render(<SendCard job={jobWithoutCover} />)

    const copyButton = screen.getByRole('button', { name: /copy cover letter/i })
    expect(copyButton).toBeDisabled()
  })

  it('should handle missing job URL', () => {
    const jobWithoutUrl = { ...mockJob, jobUrl: undefined }
    render(<SendCard job={jobWithoutUrl} />)

    // Open Upwork should not be a clickable link
    expect(screen.queryByRole('link', { name: /open upwork/i })).not.toBeInTheDocument()
  })

  it('should handle missing budget info', () => {
    const jobWithoutBudget = { ...mockJob, budgetAmount: undefined, budgetType: undefined }
    render(<SendCard job={jobWithoutBudget} />)

    // Should still render without crashing
    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })
})
