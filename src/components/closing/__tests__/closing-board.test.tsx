import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClosingBoard } from '../closing-board'
import { Job } from '@/types/brief'

// Mock next/navigation (useActionPolling uses useRouter)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock server actions
vi.mock('@/app/actions/closing', () => ({
  markContractSent: vi.fn(),
  markLost: vi.fn(),
}))

vi.mock('@/app/actions/inbox', () => ({
  markCallDone: vi.fn(),
  markContractSigned: vi.fn(),
}))

const mockEngagedJob: Job = {
  id: 'rec1',
  jobId: 'job1',
  title: 'Engaged Deal: CRM App',
  description: 'Build a CRM',
  stage: '🧐 Light Engagement',
  scrapedAt: '2026-02-10T10:00:00Z',
  responseType: 'Interview',
  budgetAmount: 500,
  budgetType: 'Fixed',
  client: 'Test Client',
}

const mockCallDoneJob: Job = {
  id: 'rec2',
  jobId: 'job2',
  title: 'Call Done: Analytics',
  description: 'Build analytics dashboard',
  stage: '🕺 Engagement with prototype',
  scrapedAt: '2026-02-10T10:00:00Z',
  callCompletedDate: '2026-02-11T10:00:00Z',
  budgetAmount: 2000,
  budgetType: 'Fixed',
  client: 'Analytics Co',
}

const mockContractSentJob: Job = {
  id: 'rec3',
  jobId: 'job3',
  title: 'Contract Sent: Dashboard',
  description: 'Build a dashboard',
  stage: '🕺 Engagement with prototype',
  scrapedAt: '2026-02-10T10:00:00Z',
  callCompletedDate: '2026-02-11T10:00:00Z',
  contractSentDate: '2026-02-12T10:00:00Z',
  budgetAmount: 3000,
  budgetType: 'Fixed',
  client: 'Dashboard Inc',
}

const mockWonJob: Job = {
  id: 'rec4',
  jobId: 'job4',
  title: 'Won: E-commerce',
  description: 'Build e-commerce site',
  stage: '🏁 Closed Won',
  scrapedAt: '2026-02-10T10:00:00Z',
  dealValue: 5000,
  closeDate: new Date().toISOString(),
  client: 'Shop Corp',
}

describe('ClosingBoard', () => {
  it('should render 4 columns', () => {
    render(
      <ClosingBoard
        engaged={[mockEngagedJob]}
        callDone={[]}
        contractSent={[]}
        won={[]}
      />
    )

    expect(screen.getByText('Engaged')).toBeInTheDocument()
    expect(screen.getByText('Call Done')).toBeInTheDocument()
    expect(screen.getByText('Contract Sent')).toBeInTheDocument()
    expect(screen.getByText('Won')).toBeInTheDocument()
  })

  it('should show deal cards in correct columns', () => {
    render(
      <ClosingBoard
        engaged={[mockEngagedJob]}
        callDone={[mockCallDoneJob]}
        contractSent={[mockContractSentJob]}
        won={[mockWonJob]}
      />
    )

    expect(screen.getByText('Engaged Deal: CRM App')).toBeInTheDocument()
    expect(screen.getByText('Call Done: Analytics')).toBeInTheDocument()
    expect(screen.getByText('Contract Sent: Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Won: E-commerce')).toBeInTheDocument()
  })

  it('should show count badges for each column', () => {
    render(
      <ClosingBoard
        engaged={[mockEngagedJob]}
        callDone={[mockCallDoneJob, { ...mockCallDoneJob, id: 'rec5', title: 'Another Call Done' }]}
        contractSent={[]}
        won={[mockWonJob]}
      />
    )

    // Check for count badges - look for exact numbers
    const badges = screen.getAllByText(/^[0-9]+$/)
    expect(badges.length).toBeGreaterThanOrEqual(4)
  })

  it('should show empty state when all columns are empty', () => {
    render(
      <ClosingBoard
        engaged={[]}
        callDone={[]}
        contractSent={[]}
        won={[]}
      />
    )

    // Each empty column shows "No deals"
    const emptyStates = screen.getAllByText('No deals')
    expect(emptyStates).toHaveLength(4)
  })

  it('should render budget information on deal cards', () => {
    render(
      <ClosingBoard
        engaged={[mockEngagedJob]}
        callDone={[]}
        contractSent={[]}
        won={[]}
      />
    )

    expect(screen.getByText(/\$500/)).toBeInTheDocument()
  })

  it('should show response type badge when available', () => {
    render(
      <ClosingBoard
        engaged={[mockEngagedJob]}
        callDone={[]}
        contractSent={[]}
        won={[]}
      />
    )

    expect(screen.getByText('Interview')).toBeInTheDocument()
  })
})
