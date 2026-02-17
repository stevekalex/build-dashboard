import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock airtable-mutations
const mockUpdateJobField = vi.fn()
const mockUpdateJobStage = vi.fn()
vi.mock('@/lib/airtable-mutations', () => ({
  updateJobField: (...args: any[]) => mockUpdateJobField(...args),
  updateJobStage: (...args: any[]) => mockUpdateJobStage(...args),
}))

describe('markContractSent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should stamp Contract Sent Date with current datetime', async () => {
    const { markContractSent } = await import('../closing')
    const result = await markContractSent('job123')

    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Contract Sent Date': expect.any(String),
    }))
    expect(result.success).toBe(true)
  })

  it('should revalidate /closing path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { markContractSent } = await import('../closing')
    await markContractSent('job123')

    expect(revalidatePath).toHaveBeenCalledWith('/closing')
  })

  it('should return error on failure', async () => {
    mockUpdateJobField.mockRejectedValue(new Error('Airtable error'))

    const { markContractSent } = await import('../closing')
    const result = await markContractSent('job123')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('markLost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should set Lost Reason and stage to Closed Lost', async () => {
    const { markLost } = await import('../closing')
    const result = await markLost('job123', 'Budget too low')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '➡️ Closed Lost',
      expect.objectContaining({
        'Lost Reason': 'Budget too low',
      })
    )
    expect(result.success).toBe(true)
  })

  it('should revalidate /closing path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { markLost } = await import('../closing')
    await markLost('job123', 'Not a fit')

    expect(revalidatePath).toHaveBeenCalledWith('/closing')
  })

  it('should return error on failure', async () => {
    mockUpdateJobStage.mockRejectedValue(new Error('Airtable error'))

    const { markLost } = await import('../closing')
    const result = await markLost('job123', 'Budget too low')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
