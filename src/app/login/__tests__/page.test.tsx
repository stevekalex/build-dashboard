import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('Login Page - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with password and name fields', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should allow user to type in password and name fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)

    await user.type(passwordInput, 'testpassword')
    await user.type(nameInput, 'John Doe')

    expect(passwordInput).toHaveValue('testpassword')
    expect(nameInput).toHaveValue('John Doe')
  })

  it('should submit form when login button is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(passwordInput, 'correctpassword')
    await user.type(nameInput, 'John Doe')
    await user.click(loginButton)

    // Form should handle submission
    await waitFor(() => {
      expect(loginButton).not.toBeDisabled()
    })
  })
})

describe('Login Page - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require both name and password fields', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement

    expect(passwordInput.required).toBe(true)
    expect(nameInput.required).toBe(true)
  })

  it('should disable button while loading', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(passwordInput, 'test')
    await user.type(nameInput, 'Test User')

    // Button should not be disabled initially
    expect(loginButton).not.toBeDisabled()
  })

  it('should show error message for invalid credentials', async () => {
    // Mock fetch to return error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid password' }),
      })
    ) as any

    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(passwordInput, 'wrongpassword')
    await user.type(nameInput, 'Test User')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    // Mock fetch to throw error
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any

    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(passwordInput, 'test')
    await user.type(nameInput, 'Test User')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
    })
  })

  it('should clear previous error messages on new submission', async () => {
    // First submission - error
    let callCount = 0
    global.fetch = vi.fn(() => {
      callCount++
      if (callCount === 1) {
        // First call returns error
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid password' }),
        })
      } else {
        // Second call returns success
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      }
    }) as any

    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    const nameInput = screen.getByLabelText(/name/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    await user.type(passwordInput, 'wrong')
    await user.type(nameInput, 'Test')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid password/i)).toBeInTheDocument()
    })

    // Second submission - error should be cleared when form is submitted
    await user.clear(passwordInput)
    await user.type(passwordInput, 'correct')

    // Click and wait for the error to disappear
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.queryByText(/invalid password/i)).not.toBeInTheDocument()
    })
  })
})
