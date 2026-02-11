import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RejectDialog } from '../reject-dialog'
import { Brief } from '@/types/brief'

const mockBrief: Brief = {
  id: 'rec123',
  jobId: 'recABC1234567890D',
  title: 'Build CRM Dashboard',
  description: 'Create a comprehensive dashboard for managing customer relationships',
  template: 'dashboard',
  buildable: true,
  brief: 'template: dashboard\nroutes: []',
  routes: [{ path: '/dashboard', name: 'Overview' }],
  createdAt: '2026-02-10T10:00:00Z',
  status: 'pending',
}

describe('RejectDialog - Happy Path', () => {
  it('should render reject button', () => {
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('should open dialog when reject button clicked', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)

    expect(screen.getByText(/reject brief/i)).toBeInTheDocument()
  })

  it('should display predefined rejection reasons', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))

    expect(screen.getByLabelText(/scope unclear/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/not buildable/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/too complex/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/other/i)).toBeInTheDocument()
  })

  it('should show custom reason textarea when Other is selected', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/other/i))

    expect(screen.getByPlaceholderText(/enter rejection reason/i)).toBeInTheDocument()
  })

  it('should call onReject with reason when confirmed', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/scope unclear/i))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('rec123', 'Scope unclear - needs more detail')
    })
  })

  it('should close dialog after successful rejection', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/scope unclear/i))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.queryByText(/reject brief/i)).not.toBeInTheDocument()
    })
  })
})

describe('RejectDialog - Edge Cases', () => {
  it('should disable confirm button when no reason selected', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    expect(confirmButton).toBeDisabled()
  })

  it('should disable confirm button when Other is selected but custom text is empty', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/other/i))

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    expect(confirmButton).toBeDisabled()
  })

  it('should enable confirm button when Other is selected and custom text provided', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/other/i))

    const textarea = screen.getByPlaceholderText(/enter rejection reason/i)
    await user.type(textarea, 'Custom rejection reason')

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    expect(confirmButton).toBeEnabled()
  })

  it('should call onReject with custom reason when Other is selected', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/other/i))

    const textarea = screen.getByPlaceholderText(/enter rejection reason/i)
    await user.type(textarea, 'Custom rejection reason')

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('rec123', 'Custom rejection reason')
    })
  })

  it('should show loading state during rejection', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/scope unclear/i))

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    expect(screen.getByRole('button', { name: /rejecting/i })).toBeDisabled()
  })

  it('should close dialog when cancel button clicked', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText(/reject brief/i)).not.toBeInTheDocument()
    })
  })

  it('should not call onReject when canceled', async () => {
    const user = userEvent.setup()
    const mockOnReject = vi.fn()
    render(<RejectDialog brief={mockBrief} onReject={mockOnReject} />)

    await user.click(screen.getByRole('button', { name: /reject/i }))
    await user.click(screen.getByLabelText(/scope unclear/i))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnReject).not.toHaveBeenCalled()
  })
})
