import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApproveList } from '../approve-list'
import { Job } from '@/types/brief'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock server actions (which import job-pulse that requires NEXT_PUBLIC_JOB_PULSE_URL)
vi.mock('@/app/actions/approve', () => ({
  approveBrief: vi.fn(),
  rejectBrief: vi.fn(),
}))

const mockJobs: Job[] = [
  {
    id: 'rec1',
    jobId: 'job1',
    title: 'Build CRM Dashboard',
    description: 'Create a CRM dashboard with analytics',
    stage: '⏸️ Pending Approval',
    scrapedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    buildable: true,
    buildableReasoning: 'Clear scope with well-defined requirements and a single user flow',
    brief: '{"template": "dashboard"}',
    template: 'dashboard',
    routes: [{ path: '/dashboard' }],
    uniqueInteractions: 'drag and drop',
    budgetAmount: 500,
    budgetType: 'Fixed',
    skills: 'React, TypeScript, Next.js',
  },
  {
    id: 'rec2',
    jobId: 'job2',
    title: 'Web App for Inventory',
    description: 'Build a web application for tracking inventory',
    stage: '⏸️ Pending Approval',
    scrapedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    buildable: true,
    buildableReasoning: 'Standard CRUD app with clear schema',
    brief: '{"template": "web_app"}',
    template: 'web_app',
    routes: [],
    budgetAmount: 1000,
    budgetType: 'Hourly',
    skills: 'Python, Django',
  },
]

describe('ApproveList - Rendering', () => {
  it('should render job cards', () => {
    render(<ApproveList jobs={mockJobs} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Web App for Inventory')).toBeInTheDocument()
  })

  it('should display budget information', () => {
    render(<ApproveList jobs={mockJobs} />)

    expect(screen.getByText(/\$500/)).toBeInTheDocument()
    expect(screen.getByText(/\(Fixed\)/)).toBeInTheDocument()
    expect(screen.getByText(/\$1,?000/)).toBeInTheDocument()
    expect(screen.getByText(/\(Hourly\)/)).toBeInTheDocument()
  })

  it('should display buildable reasoning truncated', () => {
    render(<ApproveList jobs={mockJobs} />)

    expect(screen.getByText(/Clear scope with well-defined requirements/)).toBeInTheDocument()
    expect(screen.getByText(/Standard CRUD app/)).toBeInTheDocument()
  })

  it('should display skills as badges', () => {
    render(<ApproveList jobs={mockJobs} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('Django')).toBeInTheDocument()
  })

  it('should render approve and reject buttons for each job', () => {
    render(<ApproveList jobs={mockJobs} />)

    const approveButtons = screen.getAllByRole('button', { name: /start build/i })
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i })

    expect(approveButtons).toHaveLength(2)
    expect(rejectButtons).toHaveLength(2)
  })
})

describe('ApproveList - Age calculation', () => {
  it('should show relative time for recent jobs', () => {
    const recentJob: Job = {
      ...mockJobs[0],
      scrapedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    }

    render(<ApproveList jobs={[recentJob]} />)

    expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument()
  })

  it('should show relative time for hours-old jobs', () => {
    render(<ApproveList jobs={[mockJobs[0]]} />)

    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument()
  })

  it('should show relative time for day-old jobs', () => {
    render(<ApproveList jobs={[mockJobs[1]]} />)

    expect(screen.getByText(/1 day ago/)).toBeInTheDocument()
  })
})

describe('ApproveList - Empty state', () => {
  it('should show empty state when no jobs', () => {
    render(<ApproveList jobs={[]} />)

    expect(screen.getByText(/no jobs waiting for approval/i)).toBeInTheDocument()
  })

  it('should show checkmark icon in empty state', () => {
    render(<ApproveList jobs={[]} />)

    // The empty state should contain an SVG (checkmark icon)
    const emptyState = screen.getByText(/no jobs waiting for approval/i).closest('div')
    expect(emptyState?.querySelector('svg')).toBeInTheDocument()
  })
})

describe('ApproveList - Edge cases', () => {
  it('should handle jobs without skills', () => {
    const jobWithoutSkills: Job = {
      ...mockJobs[0],
      skills: undefined,
    }

    render(<ApproveList jobs={[jobWithoutSkills]} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })

  it('should handle jobs without budget', () => {
    const jobWithoutBudget: Job = {
      ...mockJobs[0],
      budgetAmount: undefined,
      budgetType: undefined,
    }

    render(<ApproveList jobs={[jobWithoutBudget]} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })

  it('should handle jobs without buildable reasoning', () => {
    const jobWithoutReasoning: Job = {
      ...mockJobs[0],
      buildableReasoning: undefined,
    }

    render(<ApproveList jobs={[jobWithoutReasoning]} />)

    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })
})
