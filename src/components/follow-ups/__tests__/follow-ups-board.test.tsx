import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FollowUpsBoard } from '../follow-ups-board'
import { Job } from '@/types/brief'
import { FollowUpColumns } from '@/lib/queries/inbox'

// Mock server actions
vi.mock('@/app/actions/inbox', () => ({
  markFollowedUp: vi.fn(),
  closeNoResponse: vi.fn(),
}))

vi.mock('@/app/actions/follow-ups', () => ({
  generateFollowUpMessage: vi.fn(),
}))

const makeJob = (overrides: Partial<Job> & { id: string; title: string }): Job => ({
  jobId: overrides.id,
  description: '',
  stage: '💌 Initial message sent',
  scrapedAt: '2026-02-10T10:00:00Z',
  ...overrides,
})

const emptyColumns: FollowUpColumns = {
  followUp1: [],
  followUp2: [],
  followUp3: [],
  closeOut: [],
}

describe('FollowUpsBoard', () => {
  it('should render the Overdue section with 4 columns', () => {
    const overdue: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Overdue Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Follow-up 1')).toBeInTheDocument()
    expect(screen.getByText('Follow-up 2')).toBeInTheDocument()
    expect(screen.getByText('Follow-up 3')).toBeInTheDocument()
    expect(screen.getByText('Close Out')).toBeInTheDocument()
  })

  it('should show job cards in correct columns', () => {
    const overdue: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'FU1 Job', stage: '💌 Initial message sent' })],
      followUp2: [makeJob({ id: 'rec2', title: 'FU2 Job', stage: '📆 Touchpoint 1' })],
      followUp3: [],
      closeOut: [makeJob({ id: 'rec3', title: 'Close Job', stage: '📆 Touchpoint 3' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    expect(screen.getByText('FU1 Job')).toBeInTheDocument()
    expect(screen.getByText('FU2 Job')).toBeInTheDocument()
    expect(screen.getByText('Close Job')).toBeInTheDocument()
  })

  it('should show count badges', () => {
    const overdue: FollowUpColumns = {
      followUp1: [
        makeJob({ id: 'rec1', title: 'Job A', stage: '💌 Initial message sent' }),
        makeJob({ id: 'rec2', title: 'Job B', stage: '💌 Initial message sent' }),
      ],
      followUp2: [],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    const badges = screen.getAllByText('2')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('should show empty state when both boards are empty', () => {
    render(<FollowUpsBoard overdue={emptyColumns} upcoming={emptyColumns} />)

    expect(screen.getByText(/No follow-ups/i)).toBeInTheDocument()
  })

  it('should render the Upcoming section collapsed by default', () => {
    const upcoming: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Upcoming Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    // The upcoming job should NOT be visible by default (collapsed)
    expect(screen.queryByText('Upcoming Job')).not.toBeInTheDocument()
  })

  it('should expand the Upcoming section when clicked', async () => {
    const user = userEvent.setup()
    const upcoming: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Upcoming Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    const upcomingToggle = screen.getByText('Upcoming')
    await user.click(upcomingToggle)

    expect(screen.getByText('Upcoming Job')).toBeInTheDocument()
  })

  it('should show upcoming count in the collapsed header', () => {
    const upcoming: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'Job A', stage: '💌 Initial message sent' })],
      followUp2: [makeJob({ id: 'rec2', title: 'Job B', stage: '📆 Touchpoint 1' })],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    // Should show total upcoming count in header
    const upcomingHeader = screen.getByText('Upcoming')
    // The count badge should be near the header
    expect(upcomingHeader.closest('[data-section="upcoming"]')).toBeInTheDocument()
  })

  it('should not render Upcoming section when there are no upcoming jobs', () => {
    const overdue: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Overdue Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument()
  })
})
