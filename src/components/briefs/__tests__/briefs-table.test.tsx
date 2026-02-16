import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BriefsTable } from '../briefs-table'
import { Brief } from '@/types/brief'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock server actions (which import job-pulse that requires NEXT_PUBLIC_JOB_PULSE_URL)
vi.mock('@/app/actions', () => ({
  approveBrief: vi.fn(),
  rejectBriefAction: vi.fn(),
}))

const mockBriefs: Brief[] = [
  {
    id: 'rec123',
    jobId: 'recABC1234567890D',
    title: 'Build CRM Dashboard',
    description: 'Create a comprehensive dashboard for managing customer relationships with advanced data visualization, real-time analytics, and reporting capabilities',
    template: 'dashboard',
    buildable: true,
    brief: 'template: dashboard\nroutes: []',
    routes: [{ path: '/dashboard', name: 'Overview' }],
    createdAt: '2026-02-10T10:00:00Z',
    status: 'pending',
  },
  {
    id: 'rec456',
    jobId: 'recDEF1234567890G',
    title: 'Web App for Inventory',
    description: 'Build a web application for tracking inventory',
    template: 'web_app',
    buildable: false,
    brief: 'template: web_app',
    createdAt: '2026-02-10T09:00:00Z',
    status: 'pending',
  },
]

describe('BriefsTable - Happy Path', () => {
  it('should render table with briefs', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Web App for Inventory')).toBeInTheDocument()
  })

  it('should display buildable status as badge', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    expect(screen.getByText('✅ Buildable')).toBeInTheDocument()
    expect(screen.getByText('❌ Not Buildable')).toBeInTheDocument()
  })

  it('should display template type', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Web App')).toBeInTheDocument()
  })

  it('should render long descriptions with line clamping', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    // Component uses CSS line-clamp-2 for truncation
    const description = screen.getByText(/Create a comprehensive dashboard/i)
    expect(description.className).toContain('line-clamp-2')
  })

  it('should show route count', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    // Route count is split across two elements: number + label
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('route')).toBeInTheDocument()
  })

  it('should render approve and reject buttons', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    const approveButtons = screen.getAllByRole('button', { name: /start build/i })
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })

    expect(approveButtons).toHaveLength(2)
    expect(rejectButtons).toHaveLength(2)
  })
})

describe('BriefsTable - Edge Cases', () => {
  it('should show empty state when no briefs', () => {
    render(<BriefsTable briefs={[]} />)

    expect(screen.getByText(/no briefs pending approval/i)).toBeInTheDocument()
  })

  it('should handle briefs with no routes', () => {
    const briefWithoutRoutes: Brief = {
      ...mockBriefs[0],
      routes: undefined,
    }

    render(<BriefsTable briefs={[briefWithoutRoutes]} />)

    expect(screen.getByText('No routes')).toBeInTheDocument()
  })

  it('should handle short descriptions without truncation', () => {
    const briefWithShortDesc: Brief = {
      ...mockBriefs[0],
      description: 'Short desc',
    }

    render(<BriefsTable briefs={[briefWithShortDesc]} />)

    const description = screen.getByText('Short desc')
    expect(description.textContent).not.toContain('...')
  })

  it('should make job titles clickable links', () => {
    render(<BriefsTable briefs={mockBriefs} />)

    const link = screen.getByRole('link', { name: 'Build CRM Dashboard' })
    expect(link).toHaveAttribute('href', '/briefs/rec123')
  })
})
