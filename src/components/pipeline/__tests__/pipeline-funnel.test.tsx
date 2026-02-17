import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineFunnel } from '../pipeline-funnel'
import { PipelineCounts } from '@/types/brief'

const zeroCounts: PipelineCounts = {
  new: 0,
  pendingApproval: 0,
  approved: 0,
  building: 0,
  deployed: 0,
  applied: 0,
  followUps: 0,
  engaging: 0,
  closedWon: 0,
  closedLost: 0,
  buildFailed: 0,
  rejected: 0,
}

const sampleCounts: PipelineCounts = {
  new: 15,
  pendingApproval: 8,
  approved: 5,
  building: 3,
  deployed: 10,
  applied: 12,
  followUps: 7,
  engaging: 4,
  closedWon: 2,
  closedLost: 6,
  buildFailed: 1,
  rejected: 3,
}

describe('PipelineFunnel', () => {
  it('should render all four stage group headings', () => {
    render(<PipelineFunnel counts={sampleCounts} />)

    // Group headings are rendered as h2 elements
    const headings = screen.getAllByRole('heading', { level: 2 })
    const headingTexts = headings.map((h) => h.textContent)

    expect(headingTexts).toContain('Inbound')
    expect(headingTexts).toContain('Building')
    expect(headingTexts).toContain('Outreach')
    expect(headingTexts).toContain('Closing')
  })

  it('should show total count', () => {
    render(<PipelineFunnel counts={sampleCounts} />)

    // Total = 15+8+5+3+10+12+7+4+2+6+1+3 = 76
    expect(screen.getByText('76')).toBeInTheDocument()
    expect(screen.getByText(/total jobs/i)).toBeInTheDocument()
  })

  it('should display all stage labels via meter aria-labels', () => {
    render(<PipelineFunnel counts={sampleCounts} />)

    // Each stage renders a meter with an aria-label like "New: 15"
    const meters = screen.getAllByRole('meter')
    const labels = meters.map((m) => m.getAttribute('aria-label'))

    expect(labels).toContain('New: 15')
    expect(labels).toContain('Pending Approval: 8')
    expect(labels).toContain('Approved: 5')
    expect(labels).toContain('Building: 3')
    expect(labels).toContain('Deployed: 10')
    expect(labels).toContain('Build Failed: 1')
    expect(labels).toContain('Applied: 12')
    expect(labels).toContain('Follow-ups: 7')
    expect(labels).toContain('Engaging: 4')
    expect(labels).toContain('Won: 2')
    expect(labels).toContain('Lost: 6')
    expect(labels).toContain('Rejected: 3')
  })

  it('should display counts for each stage', () => {
    render(<PipelineFunnel counts={sampleCounts} />)

    // Check that specific count values appear in the document
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('should render bar widths proportional to max count', () => {
    render(<PipelineFunnel counts={sampleCounts} />)

    // 12 stage bars
    const meters = screen.getAllByRole('meter')
    expect(meters.length).toBe(12)

    // Find the bar for "New" (count=15, max=15) — should be 100%
    const newBar = screen.getByTestId('stage-bar-new')
    expect(newBar.style.width).toBe('100%')

    // Find the bar for "Building" (count=3, max=15) — should be 20%
    const buildingBar = screen.getByTestId('stage-bar-building')
    expect(buildingBar.style.width).toBe('20%')
  })

  it('should render correctly with all zero counts', () => {
    render(<PipelineFunnel counts={zeroCounts} />)

    // Should still render all stage group headings
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings).toHaveLength(4)

    // Total should be 0
    const totalText = screen.getByText(/total jobs/i)
    expect(totalText.previousElementSibling?.textContent).toBe('0')

    // All bars should have 0% width (no division by zero crash)
    const meters = screen.getAllByRole('meter')
    for (const meter of meters) {
      expect(meter.style.width).toBe('0%')
    }
  })

  it('should render correctly with a single non-zero stage', () => {
    const singleCount: PipelineCounts = {
      ...zeroCounts,
      closedWon: 5,
    }

    render(<PipelineFunnel counts={singleCount} />)

    // Total should be 5
    const totalText = screen.getByText(/total jobs/i)
    expect(totalText.previousElementSibling?.textContent).toBe('5')

    const wonBar = screen.getByTestId('stage-bar-closedWon')
    expect(wonBar.style.width).toBe('100%')
  })
})
