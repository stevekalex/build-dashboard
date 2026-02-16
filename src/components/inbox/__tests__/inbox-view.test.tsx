import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InboxView } from '../inbox-view'
import { Job } from '@/types/brief'

// Mock server actions
vi.mock('@/app/actions/inbox', () => ({
  logResponse: vi.fn(),
  markFollowedUp: vi.fn(),
  closeNoResponse: vi.fn(),
  markCallDone: vi.fn(),
  markContractSigned: vi.fn(),
}))

const mockHotLead: Job = {
  id: 'rec1',
  jobId: 'job1',
  title: 'Hot Lead: CRM Dashboard',
  description: 'Build a CRM dashboard',
  stage: '🧐 Light Engagement',
  scrapedAt: '2026-02-10T10:00:00Z',
  appliedAt: '2026-02-08T10:00:00Z',
  responseDate: '2026-02-09T10:00:00Z',
  responseType: 'Shortlist',
  jobUrl: 'https://upwork.com/job/1',
  budgetAmount: 500,
  budgetType: 'Fixed',
  client: 'Test Client',
}

const mockAwaitingResponse: Job = {
  id: 'rec2',
  jobId: 'job2',
  title: 'Awaiting: Inventory App',
  description: 'Build inventory tracking app',
  stage: '💌 Initial message sent',
  scrapedAt: '2026-02-10T10:00:00Z',
  appliedAt: '2026-02-09T10:00:00Z',
  jobUrl: 'https://upwork.com/job/2',
  budgetAmount: 300,
  budgetType: 'Hourly',
  client: 'Another Client',
}

const mockFollowUp: Job = {
  id: 'rec3',
  jobId: 'job3',
  title: 'Follow Up: Analytics Tool',
  description: 'Build analytics tool',
  stage: '📆 Touchpoint 1',
  scrapedAt: '2026-02-05T10:00:00Z',
  appliedAt: '2026-02-06T10:00:00Z',
  nextActionDate: '2026-02-10T10:00:00Z',
  jobUrl: 'https://upwork.com/job/3',
  budgetAmount: 750,
  budgetType: 'Fixed',
  client: 'Follow Up Client',
}

describe('InboxView', () => {
  it('should render all 3 sections', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[mockAwaitingResponse]}
        followUpsDue={[mockFollowUp]}
      />
    )

    expect(screen.getByText(/Hot Leads/)).toBeInTheDocument()
    expect(screen.getByText(/Awaiting Response/)).toBeInTheDocument()
    expect(screen.getByText(/Follow-ups Due/)).toBeInTheDocument()
  })

  it('should show counts for each section', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[mockAwaitingResponse, { ...mockAwaitingResponse, id: 'rec4', title: 'Another' }]}
        followUpsDue={[mockFollowUp]}
      />
    )

    // Check count badges exist
    const badges = screen.getAllByText(/^[0-9]+$/)
    expect(badges.length).toBeGreaterThanOrEqual(3)
  })

  it('should render job titles from all sections', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[mockAwaitingResponse]}
        followUpsDue={[mockFollowUp]}
      />
    )

    expect(screen.getByText('Hot Lead: CRM Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Awaiting: Inventory App')).toBeInTheDocument()
    expect(screen.getByText('Follow Up: Analytics Tool')).toBeInTheDocument()
  })

  it('should toggle section visibility when clicking section header', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[mockAwaitingResponse]}
        followUpsDue={[mockFollowUp]}
      />
    )

    // Sections start open - job titles are visible
    expect(screen.getByText('Hot Lead: CRM Dashboard')).toBeVisible()

    // Click the Hot Leads section header to collapse
    const hotLeadsHeader = screen.getByText(/Hot Leads/)
    fireEvent.click(hotLeadsHeader)

    // Job title should be hidden
    expect(screen.queryByText('Hot Lead: CRM Dashboard')).not.toBeInTheDocument()
  })

  it('should show empty state when Hot Leads section is empty', () => {
    render(
      <InboxView
        hotLeads={[]}
        awaitingResponse={[mockAwaitingResponse]}
        followUpsDue={[mockFollowUp]}
      />
    )

    expect(screen.getByText(/No hot leads/i)).toBeInTheDocument()
  })

  it('should show empty state when Awaiting Response section is empty', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[]}
        followUpsDue={[mockFollowUp]}
      />
    )

    expect(screen.getByText(/No jobs awaiting response/i)).toBeInTheDocument()
  })

  it('should show empty state when Follow-ups Due section is empty', () => {
    render(
      <InboxView
        hotLeads={[mockHotLead]}
        awaitingResponse={[mockAwaitingResponse]}
        followUpsDue={[]}
      />
    )

    expect(screen.getByText(/No follow-ups due/i)).toBeInTheDocument()
  })

  it('should show empty state for all sections when all are empty', () => {
    render(
      <InboxView
        hotLeads={[]}
        awaitingResponse={[]}
        followUpsDue={[]}
      />
    )

    expect(screen.getByText(/No hot leads/i)).toBeInTheDocument()
    expect(screen.getByText(/No jobs awaiting response/i)).toBeInTheDocument()
    expect(screen.getByText(/No follow-ups due/i)).toBeInTheDocument()
  })
})
