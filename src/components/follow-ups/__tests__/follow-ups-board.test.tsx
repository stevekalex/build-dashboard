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
  // --- Outstanding (overdue vertical list) ---

  it('should render the Outstanding section with overdue jobs as a vertical list', () => {
    const overdue: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'Overdue Job A', stage: '💌 Initial message sent' })],
      followUp2: [makeJob({ id: 'rec2', title: 'Overdue Job B', stage: '📆 Touchpoint 1' })],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    expect(screen.getByText('Outstanding')).toBeInTheDocument()
    expect(screen.getByText('Overdue Job A')).toBeInTheDocument()
    expect(screen.getByText('Overdue Job B')).toBeInTheDocument()
  })

  it('should show Outstanding count badge', () => {
    const overdue: FollowUpColumns = {
      followUp1: [
        makeJob({ id: 'rec1', title: 'Job A', stage: '💌 Initial message sent' }),
        makeJob({ id: 'rec2', title: 'Job B', stage: '💌 Initial message sent' }),
      ],
      followUp2: [makeJob({ id: 'rec3', title: 'Job C', stage: '📆 Touchpoint 1' })],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    // Should show total outstanding count (3)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should show Outstanding section expanded by default', () => {
    const overdue: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Visible Overdue', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    // Cards should be visible without clicking anything
    expect(screen.getByText('Visible Overdue')).toBeInTheDocument()
  })

  it('should show all overdue jobs from all columns in a flat list (not kanban)', () => {
    const overdue: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'FU1 Job', stage: '💌 Initial message sent' })],
      followUp2: [makeJob({ id: 'rec2', title: 'FU2 Job', stage: '📆 Touchpoint 1' })],
      followUp3: [makeJob({ id: 'rec3', title: 'FU3 Job', stage: '📆 Touchpoint 2' })],
      closeOut: [makeJob({ id: 'rec4', title: 'Close Job', stage: '📆 Touchpoint 3' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    // All 4 jobs should be visible
    expect(screen.getByText('FU1 Job')).toBeInTheDocument()
    expect(screen.getByText('FU2 Job')).toBeInTheDocument()
    expect(screen.getByText('FU3 Job')).toBeInTheDocument()
    expect(screen.getByText('Close Job')).toBeInTheDocument()

    // Should NOT have kanban column headers in the Outstanding section
    expect(screen.queryByText('Follow-up 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Follow-up 2')).not.toBeInTheDocument()
  })

  // --- Upcoming (kanban) ---

  it('should render the Upcoming section collapsed by default', () => {
    const upcoming: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Upcoming Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.queryByText('Upcoming Job')).not.toBeInTheDocument()
  })

  it('should expand Upcoming section with kanban columns when clicked', async () => {
    const user = userEvent.setup()
    const upcoming: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'Upcoming Job', stage: '💌 Initial message sent' })],
      followUp2: [],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    await user.click(screen.getByText('Upcoming'))

    expect(screen.getByText('Upcoming Job')).toBeInTheDocument()
    // Kanban column headers should appear
    expect(screen.getByText('Follow-up 1')).toBeInTheDocument()
    expect(screen.getByText('Follow-up 2')).toBeInTheDocument()
    expect(screen.getByText('Follow-up 3')).toBeInTheDocument()
    expect(screen.getByText('Close Out')).toBeInTheDocument()
  })

  it('should show upcoming count in the collapsed header', () => {
    const upcoming: FollowUpColumns = {
      followUp1: [makeJob({ id: 'rec1', title: 'Job A', stage: '💌 Initial message sent' })],
      followUp2: [makeJob({ id: 'rec2', title: 'Job B', stage: '📆 Touchpoint 1' })],
      followUp3: [],
      closeOut: [],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    const upcomingSection = screen.getByText('Upcoming').closest('[data-section="upcoming"]')
    expect(upcomingSection).toBeInTheDocument()
  })

  // --- Empty / edge cases ---

  it('should show empty state when both boards are empty', () => {
    render(<FollowUpsBoard overdue={emptyColumns} upcoming={emptyColumns} />)

    expect(screen.getByText(/No follow-ups/i)).toBeInTheDocument()
  })

  it('should not render Upcoming section when there are no upcoming jobs', () => {
    const overdue: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Overdue Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={overdue} upcoming={emptyColumns} />)

    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument()
  })

  it('should not render Outstanding section when there are no overdue jobs', () => {
    const upcoming: FollowUpColumns = {
      ...emptyColumns,
      followUp1: [makeJob({ id: 'rec1', title: 'Upcoming Job', stage: '💌 Initial message sent' })],
    }

    render(<FollowUpsBoard overdue={emptyColumns} upcoming={upcoming} />)

    expect(screen.queryByText('Outstanding')).not.toBeInTheDocument()
  })
})
