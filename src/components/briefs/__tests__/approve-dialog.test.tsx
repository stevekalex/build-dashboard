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
  brief: JSON.stringify({
    done_criteria: ['Build the dashboard', 'Add charts'],
    prototype: { name: 'CRM Dashboard' },
  }),
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

    // Dialog title is "Start Build"
    expect(screen.getByText('Build CRM Dashboard')).toBeInTheDocument()
  })

  it('should display brief details in dialog', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    // Shows description and done criteria
    expect(screen.getByText('Create a dashboard')).toBeInTheDocument()
    expect(screen.getByText('Build the dashboard')).toBeInTheDocument()
    expect(screen.getByText('Add charts')).toBeInTheDocument()
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
      expect(mockOnApprove).toHaveBeenCalledWith(mockBrief.id, '')
    })
  })

  it('should close dialog when cancelled', async () => {
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))
    expect(screen.getByText(/45 minute/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText(/45 minute/i)).not.toBeInTheDocument()
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

    expect(screen.getByText(/starting build/i)).toBeInTheDocument()
  })

  it('should handle briefs with no done criteria', async () => {
    const briefWithoutCriteria = { ...mockBrief, brief: '{}' }
    const user = userEvent.setup()
    render(<ApproveDialog brief={briefWithoutCriteria} onApprove={mockOnApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    // Should still show the dialog without the Key Tasks section
    expect(screen.queryByText(/key tasks/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('should pass notes to onApprove when provided', async () => {
    const onApprove = vi.fn()
    const user = userEvent.setup()
    render(<ApproveDialog brief={mockBrief} onApprove={onApprove} />)

    await user.click(screen.getByRole('button', { name: /start build/i }))

    const notesTextarea = screen.getByPlaceholderText(/add any notes about this approval/i)
    await user.type(notesTextarea, 'Looks good to build')
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(mockBrief.id, 'Looks good to build')
    })
  })
})
