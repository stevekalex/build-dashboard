import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InboxSectionPage } from '../inbox-section-page'
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

describe('InboxSectionPage', () => {
  it('should render section with jobs', () => {
    render(
      <InboxSectionPage
        jobs={[mockHotLead]}
        section="hot-leads"
        emoji="🔥"
        title="Hot Leads"
        description="Warm leads"
        filter="Response Type is Shortlist, Interview, or Hire"
        emptyMessage="No hot leads right now"
      />
    )

    expect(screen.getByText(/Hot Leads/)).toBeInTheDocument()
    expect(screen.getByText('Hot Lead: CRM Dashboard')).toBeInTheDocument()
  })

  it('should show count badge', () => {
    render(
      <InboxSectionPage
        jobs={[mockAwaitingResponse, { ...mockAwaitingResponse, id: 'rec4', title: 'Another' }]}
        section="awaiting-response"
        emoji="📬"
        title="Awaiting Response"
        description="Monitoring"
        filter="Applied At is set"
        emptyMessage="No jobs awaiting response"
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should toggle section visibility when clicking header', () => {
    render(
      <InboxSectionPage
        jobs={[mockHotLead]}
        section="hot-leads"
        emoji="🔥"
        title="Hot Leads"
        description="Warm leads"
        filter="Response Type is Shortlist, Interview, or Hire"
        emptyMessage="No hot leads right now"
      />
    )

    expect(screen.getByText('Hot Lead: CRM Dashboard')).toBeVisible()

    const header = screen.getByText(/Hot Leads/)
    fireEvent.click(header)

    expect(screen.queryByText('Hot Lead: CRM Dashboard')).not.toBeInTheDocument()
  })

  it('should show empty state when no jobs', () => {
    render(
      <InboxSectionPage
        jobs={[]}
        section="hot-leads"
        emoji="🔥"
        title="Hot Leads"
        description="Warm leads"
        filter="Response Type is Shortlist, Interview, or Hire"
        emptyMessage="No hot leads right now"
      />
    )

    expect(screen.getByText(/No hot leads/i)).toBeInTheDocument()
  })

  it('should render follow-ups section', () => {
    render(
      <InboxSectionPage
        jobs={[mockFollowUp]}
        section="follow-ups-due"
        emoji="📆"
        title="Follow-ups Due"
        description="Due today or overdue"
        filter="Next Action Date is today or earlier"
        emptyMessage="No follow-ups due today"
      />
    )

    expect(screen.getByText(/Follow-ups Due/)).toBeInTheDocument()
    expect(screen.getByText('Follow Up: Analytics Tool')).toBeInTheDocument()
  })
})
