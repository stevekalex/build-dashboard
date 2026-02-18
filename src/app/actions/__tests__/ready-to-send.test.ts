import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock airtable-mutations
const mockUpdateJobField = vi.fn()
const mockUpdateJobStage = vi.fn()
vi.mock('@/lib/airtable-mutations', () => ({
  updateJobField: (...args: any[]) => mockUpdateJobField(...args),
  updateJobStage: (...args: any[]) => mockUpdateJobStage(...args),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

// Mock next/headers
const mockGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockGet,
  })),
}))

describe('saveLoomUrl - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
  })

  it('should save Loom URL', async () => {
    const { saveLoomUrl } = await import('../ready-to-send')
    const result = await saveLoomUrl('rec123', 'https://loom.com/share/abc')

    expect(result.success).toBe(true)
    expect(mockUpdateJobField).toHaveBeenCalledWith('rec123', {
      'Loom URL': 'https://loom.com/share/abc',
    })
  })

  it('should revalidate jobs-ready-to-send tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { saveLoomUrl } = await import('../ready-to-send')
    await saveLoomUrl('rec123', 'https://loom.com/share/abc')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-ready-to-send', 'dashboard')
  })
})

describe('saveLoomUrl - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject empty URL', async () => {
    const { saveLoomUrl } = await import('../ready-to-send')
    const result = await saveLoomUrl('rec123', '')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockUpdateJobField).not.toHaveBeenCalled()
  })

  it('should reject whitespace-only URL', async () => {
    const { saveLoomUrl } = await import('../ready-to-send')
    const result = await saveLoomUrl('rec123', '   ')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockUpdateJobField).not.toHaveBeenCalled()
  })

  it('should handle Airtable update failure', async () => {
    mockUpdateJobField.mockRejectedValue(new Error('Airtable error'))

    const { saveLoomUrl } = await import('../ready-to-send')
    const result = await saveLoomUrl('rec123', 'https://loom.com/share/abc')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Airtable error')
  })
})

describe('markApplied - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobStage.mockResolvedValue(undefined)
    mockGet.mockReturnValue({ value: JSON.stringify({ name: 'John Doe' }) })
  })

  it('should stamp Applied At with current ISO datetime', async () => {
    const { markApplied } = await import('../ready-to-send')
    const result = await markApplied('rec123')

    expect(result.success).toBe(true)
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'rec123',
      '📆 Touchpoint 1',
      expect.objectContaining({
        'Applied At': expect.any(String),
      })
    )

    // Verify the Applied At is a valid ISO date
    const callArgs = mockUpdateJobStage.mock.calls[0]
    const appliedAt = callArgs[2]['Applied At']
    expect(new Date(appliedAt).toISOString()).toBe(appliedAt)
  })

  it('should stamp Loom Recorded Date with current ISO datetime', async () => {
    const { markApplied } = await import('../ready-to-send')
    const result = await markApplied('rec123')

    expect(result.success).toBe(true)
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'rec123',
      '📆 Touchpoint 1',
      expect.objectContaining({
        'Loom Recorded Date': expect.any(String),
      })
    )

    // Verify the Loom Recorded Date is a valid ISO date
    const callArgs = mockUpdateJobStage.mock.calls[0]
    const loomRecordedDate = callArgs[2]['Loom Recorded Date']
    expect(new Date(loomRecordedDate).toISOString()).toBe(loomRecordedDate)
  })

  it('should update stage to Touchpoint 1', async () => {
    const { markApplied } = await import('../ready-to-send')
    await markApplied('rec123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'rec123',
      '📆 Touchpoint 1',
      expect.any(Object)
    )
  })

  it('should revalidate jobs-ready-to-send tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { markApplied } = await import('../ready-to-send')
    await markApplied('rec123')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-ready-to-send', 'dashboard')
  })
})

describe('markApplied - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle missing session cookie', async () => {
    mockGet.mockReturnValue(undefined)
    mockUpdateJobStage.mockResolvedValue(undefined)

    const { markApplied } = await import('../ready-to-send')
    const result = await markApplied('rec123')

    // Should still succeed even without a user session
    expect(result.success).toBe(true)
  })

  it('should handle Airtable update failure', async () => {
    mockGet.mockReturnValue({ value: JSON.stringify({ name: 'John Doe' }) })
    mockUpdateJobStage.mockRejectedValue(new Error('Update failed'))

    const { markApplied } = await import('../ready-to-send')
    const result = await markApplied('rec123')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Update failed')
  })
})
