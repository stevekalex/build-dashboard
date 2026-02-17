import { describe, it, expect, vi, beforeEach } from 'vitest'

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

// Mock job-pulse — pass through JobPulseError class for instanceof checks
const mockTriggerBuild = vi.fn()
const mockRejectBuild = vi.fn()
vi.mock('@/lib/job-pulse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/job-pulse')>()
  return {
    ...actual,
    triggerBuild: (...args: any[]) => mockTriggerBuild(...args),
    rejectBuild: (...args: any[]) => mockRejectBuild(...args),
  }
})

// Mock airtable-mutations
const mockUpdateJobField = vi.fn()
vi.mock('@/lib/airtable-mutations', () => ({
  updateJobField: (...args: any[]) => mockUpdateJobField(...args),
}))

describe('approveBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue({ value: JSON.stringify({ name: 'Steve' }) })
    mockTriggerBuild.mockResolvedValue({ success: true })
    mockUpdateJobField.mockResolvedValue(undefined)
  })

  it('should call triggerBuild with correct arguments', async () => {
    const { approveBrief } = await import('../approve')
    await approveBrief('job123', 'some notes')

    expect(mockTriggerBuild).toHaveBeenCalledWith('job123', 'Steve', 'some notes')
  })

  it('should not write to Airtable directly (Job Pulse handles state)', async () => {
    const { approveBrief } = await import('../approve')
    await approveBrief('job123')

    expect(mockUpdateJobField).not.toHaveBeenCalled()
  })

  it('should revalidate cache tags', async () => {
    const { revalidateTag } = await import('next/cache')
    const { approveBrief } = await import('../approve')
    await approveBrief('job123')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-approve', 'dashboard')
    expect(revalidateTag).toHaveBeenCalledWith('jobs-building', 'dashboard')
  })

  it('should return success on successful approval', async () => {
    const { approveBrief } = await import('../approve')
    const result = await approveBrief('job123')

    expect(result).toEqual({ success: true })
  })

  it('should return error when triggerBuild fails', async () => {
    mockTriggerBuild.mockRejectedValue(new Error('Build trigger failed'))

    const { approveBrief } = await import('../approve')
    const result = await approveBrief('job123')

    expect(result).toEqual({
      success: false,
      error: 'Build trigger failed',
      code: undefined,
    })
  })

  it('should use Unknown User when no session cookie', async () => {
    mockGet.mockReturnValue(undefined)

    const { approveBrief } = await import('../approve')
    await approveBrief('job123')

    expect(mockTriggerBuild).toHaveBeenCalledWith('job123', 'Unknown User', undefined)
  })

  it('should use Unknown User when session cookie is invalid JSON', async () => {
    mockGet.mockReturnValue({ value: 'not-json' })

    const { approveBrief } = await import('../approve')
    await approveBrief('job123')

    expect(mockTriggerBuild).toHaveBeenCalledWith('job123', 'Unknown User', undefined)
  })
})

describe('rejectBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue({ value: JSON.stringify({ name: 'Steve' }) })
    mockRejectBuild.mockResolvedValue({ success: true })
  })

  it('should call rejectBuild with correct arguments', async () => {
    const { rejectBrief } = await import('../approve')
    await rejectBrief('job123', 'Scope unclear', 'some notes')

    expect(mockRejectBuild).toHaveBeenCalledWith('job123', 'Scope unclear', 'Steve', 'some notes')
  })

  it('should revalidate cache tags', async () => {
    const { revalidateTag } = await import('next/cache')
    const { rejectBrief } = await import('../approve')
    await rejectBrief('job123', 'Too complex')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-approve', 'dashboard')
    expect(revalidateTag).toHaveBeenCalledWith('jobs-building', 'dashboard')
  })

  it('should return success on successful rejection', async () => {
    const { rejectBrief } = await import('../approve')
    const result = await rejectBrief('job123', 'Not buildable')

    expect(result).toEqual({ success: true })
  })

  it('should return error when rejectBuild fails', async () => {
    mockRejectBuild.mockRejectedValue(new Error('Rejection failed'))

    const { rejectBrief } = await import('../approve')
    const result = await rejectBrief('job123', 'Scope unclear')

    expect(result).toEqual({
      success: false,
      error: 'Rejection failed',
      code: undefined,
    })
  })

  it('should return error code from JobPulseError', async () => {
    const { JobPulseError } = await import('@/lib/job-pulse')
    mockTriggerBuild.mockRejectedValue(
      new JobPulseError(409, 'WRONG_STAGE', 'Job is not in PENDING_APPROVAL stage')
    )

    const { approveBrief } = await import('../approve')
    const result = await approveBrief('job123')

    expect(result).toEqual({
      success: false,
      error: 'Job is not in PENDING_APPROVAL stage',
      code: 'WRONG_STAGE',
    })
  })
})
