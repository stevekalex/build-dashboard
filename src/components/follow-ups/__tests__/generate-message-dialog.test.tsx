import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerateMessageDialog } from '../generate-message-dialog'

// Mock server action
const mockGenerateFollowUpMessage = vi.fn()
vi.mock('@/app/actions/follow-ups', () => ({
  generateFollowUpMessage: (...args: any[]) => mockGenerateFollowUpMessage(...args),
}))

describe('GenerateMessageDialog', () => {
  const mockOnSent = vi.fn()
  const mockOnMarkSent = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the trigger button', () => {
    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    expect(screen.getByText('Generate Message')).toBeInTheDocument()
  })

  it('should open dialog and show generate button when trigger clicked', async () => {
    const user = userEvent.setup()
    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    await user.click(screen.getByText('Generate Message'))

    expect(screen.getByText('Generate Follow-Up Message')).toBeInTheDocument()
    // The inner "Generate Message" button in the dialog
    const buttons = screen.getAllByText('Generate Message')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('should show generated message in textarea after generation', async () => {
    const user = userEvent.setup()
    mockGenerateFollowUpMessage.mockResolvedValue({
      success: true,
      message: 'Hey, just saw your project is still open...',
    })

    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    // Open dialog
    await user.click(screen.getByText('Generate Message'))

    // Click generate inside dialog
    const generateButtons = screen.getAllByText('Generate Message')
    await user.click(generateButtons[generateButtons.length - 1])

    // Wait for the message to appear in the textarea
    await waitFor(() => {
      expect(screen.getByDisplayValue('Hey, just saw your project is still open...')).toBeInTheDocument()
    })

    // Should show Copy and Mark Sent buttons
    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.getByText('Mark Sent')).toBeInTheDocument()
  })

  it('should show error when generation fails', async () => {
    const user = userEvent.setup()
    mockGenerateFollowUpMessage.mockResolvedValue({
      success: false,
      error: 'API rate limit exceeded',
    })

    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    await user.click(screen.getByText('Generate Message'))
    const generateButtons = screen.getAllByText('Generate Message')
    await user.click(generateButtons[generateButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
    })
  })

  it('should call onSent and onMarkSent when Mark Sent is clicked', async () => {
    const user = userEvent.setup()
    mockGenerateFollowUpMessage.mockResolvedValue({
      success: true,
      message: 'Follow-up message text',
    })

    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    // Open, generate, then mark sent
    await user.click(screen.getByText('Generate Message'))
    const generateButtons = screen.getAllByText('Generate Message')
    await user.click(generateButtons[generateButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('Mark Sent')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Mark Sent'))

    expect(mockOnSent).toHaveBeenCalledOnce()
    expect(mockOnMarkSent).toHaveBeenCalledOnce()
  })

  it('should allow editing the generated message', async () => {
    const user = userEvent.setup()
    mockGenerateFollowUpMessage.mockResolvedValue({
      success: true,
      message: 'Original message',
    })

    render(
      <GenerateMessageDialog
        jobId="rec1"
        stage="💌 Initial message sent"
        onSent={mockOnSent}
        onMarkSent={mockOnMarkSent}
      />
    )

    await user.click(screen.getByText('Generate Message'))
    const generateButtons = screen.getAllByText('Generate Message')
    await user.click(generateButtons[generateButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original message')).toBeInTheDocument()
    })

    const textarea = screen.getByLabelText('Generated follow-up message')
    await user.clear(textarea)
    await user.type(textarea, 'Edited message')

    expect(screen.getByDisplayValue('Edited message')).toBeInTheDocument()
  })
})
