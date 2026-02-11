import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApproveDialog } from '../approve-dialog'
import { Brief } from '@/types/brief'

const mockBrief: Brief = {
  id: 'rec123',
  jobId: 'recABC1234567890D',
  title: 'Build CRM Dashboard',
  description: 'Create a dashboard',
  template: 'dashboard',
  buildable: true,
  brief: 'template: dashboard\nroutes:\n  - path: /dashboard\n    name: Overview',
  routes: [{ path: '/dashboard', name: 'Overview' }],
  createdAt: '2026-02-10T10:00:00Z',
  status: 'pending',
}

const mockOnApprove = vi.fn()

describe('ApproveDialog - Happy Path', () => {
  it('should render trigger button', () => {
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    expect(screen.getByRole('button', { name: /start build/i })).toBeInTheDocument()
  })

  it('should open dialog when trigger button is clicked', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    const button = screen.getByRole('button', { name: /start build/i })
    await user.click(button)

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
  })

  it('should display brief details in dialog', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    expect(screen.getByText(/approve build/i)).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText(/1 route/i)).toBeInTheDocument()
  })

  it('should show warning about build duration', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    expect(screen.getByText(/45 minute/i)).toBeInTheDocument()
  })

  it('should call onApprove when confirmed', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith(mockBrief.id)
    })
  })

  it('should close dialog when cancelled', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
    })
  })
})

describe('ApproveDialog - Edge Cases', () => {
  it('should disable buttons while loading', async () => {
    const slowApprove = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={slowApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Button should be disabled during loading
    expect(confirmButton).toBeDisabled()
  })

  it('should show loading state on button', async () => {
    const slowApprove = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={slowApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(screen.getByText(/approving/i)).toBeInTheDocument()
  })

  it('should handle briefs with no routes', async () => {
    const briefWithoutRoutes = { ...mockBrief, routes: undefined }
    const user = userEvent.setup()
    render(<ApproveDialog brief={briefWithoutRoutes} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    expect(screen.getByText(/0 routes/i)).toBeInTheDocument()
  })
})
