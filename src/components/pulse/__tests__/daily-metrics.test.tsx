import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyMetricsView } from '../daily-metrics'
import { DailyMetrics } from '@/types/brief'

const mockMetrics: DailyMetrics = {
  jobsDetected: 12,
  jobsApproved: 5,
  prototypesBuilt: 3,
  applicationsSent: 8,
  responsesReceived: 2,
  callsCompleted: 1,
  contractsSigned: 0,
  date: '2026-02-16',
}

describe('DailyMetricsView', () => {
  it('should render all 7 metric cards', () => {
    render(<DailyMetricsView metrics={mockMetrics} />)

    expect(screen.getByText('Jobs Detected')).toBeInTheDocument()
    expect(screen.getByText('Jobs Approved')).toBeInTheDocument()
    expect(screen.getByText('Prototypes Built')).toBeInTheDocument()
    expect(screen.getByText('Applications Sent')).toBeInTheDocument()
    expect(screen.getByText('Responses Received')).toBeInTheDocument()
    expect(screen.getByText('Calls Completed')).toBeInTheDocument()
    expect(screen.getByText('Contracts Signed')).toBeInTheDocument()
  })

  it('should display correct numbers for each metric', () => {
    render(<DailyMetricsView metrics={mockMetrics} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should render icons for each metric card', () => {
    const { container } = render(<DailyMetricsView metrics={mockMetrics} />)

    // Each metric card should have an SVG icon
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(7)
  })

  it('should handle all-zero metrics', () => {
    const zeroMetrics: DailyMetrics = {
      jobsDetected: 0,
      jobsApproved: 0,
      prototypesBuilt: 0,
      applicationsSent: 0,
      responsesReceived: 0,
      callsCompleted: 0,
      contractsSigned: 0,
      date: '2026-02-16',
    }

    render(<DailyMetricsView metrics={zeroMetrics} />)

    // All labels should still render
    expect(screen.getByText('Jobs Detected')).toBeInTheDocument()
    expect(screen.getByText('Contracts Signed')).toBeInTheDocument()

    // All 7 zeroes should be visible
    const zeroes = screen.getAllByText('0')
    expect(zeroes).toHaveLength(7)
  })

  it('should handle large numbers', () => {
    const largeMetrics: DailyMetrics = {
      jobsDetected: 999,
      jobsApproved: 100,
      prototypesBuilt: 50,
      applicationsSent: 200,
      responsesReceived: 75,
      callsCompleted: 30,
      contractsSigned: 10,
      date: '2026-02-16',
    }

    render(<DailyMetricsView metrics={largeMetrics} />)

    expect(screen.getByText('999')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('should use a responsive grid layout', () => {
    const { container } = render(<DailyMetricsView metrics={mockMetrics} />)

    // The grid container should have responsive column classes
    const grid = container.firstElementChild
    expect(grid?.className).toContain('grid')
    expect(grid?.className).toContain('grid-cols-2')
  })
})
