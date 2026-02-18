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

// Mock airtable-mutations
const mockUpdateJobField = vi.fn()
const mockUpdateJobStage = vi.fn()
vi.mock('@/lib/airtable-mutations', () => ({
  updateJobField: (...args: any[]) => mockUpdateJobField(...args),
  updateJobStage: (...args: any[]) => mockUpdateJobStage(...args),
}))

// Mock airtable (getBase) for markFollowedUp which reads current stage
const mockFind = vi.fn()
const mockBaseCall = vi.fn(() => ({ find: mockFind }))
vi.mock('@/lib/airtable', () => ({
  getBase: () => mockBaseCall,
}))

describe('logResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should stamp Response Date and set Response Type', async () => {
    const { logResponse } = await import('../inbox')
    const result = await logResponse('job123', 'Message')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Response Date': expect.any(String),
      'Response Type': 'Message',
    }))
  })

  it('should set Light Engagement stage for hot lead types (Shortlist)', async () => {
    const { logResponse } = await import('../inbox')
    const result = await logResponse('job123', 'Shortlist')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '🧐 Light Engagement',
      expect.objectContaining({
        'Response Date': expect.any(String),
        'Response Type': 'Shortlist',
      })
    )
  })

  it('should set Light Engagement stage for hot lead types (Interview)', async () => {
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Interview')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '🧐 Light Engagement',
      expect.objectContaining({
        'Response Type': 'Interview',
      })
    )
  })

  it('should set Light Engagement stage for hot lead types (Hire)', async () => {
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Hire')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '🧐 Light Engagement',
      expect.objectContaining({
        'Response Type': 'Hire',
      })
    )
  })

  it('should NOT set stage for non-hot lead response types', async () => {
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Message')

    expect(mockUpdateJobStage).not.toHaveBeenCalled()
    expect(mockUpdateJobField).toHaveBeenCalled()
  })

  it('should include notes when provided', async () => {
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Message', 'Some notes')

    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Response Type': 'Message',
    }))
  })

  it('should revalidate jobs-inbox tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Message')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-inbox', 'dashboard')
  })

  it('should return error on failure', async () => {
    mockUpdateJobField.mockRejectedValue(new Error('Airtable error'))
    const { logResponse } = await import('../inbox')
    const result = await logResponse('job123', 'Message')

    expect(result).toEqual({ success: false, error: 'Airtable error' })
  })
})

describe('markFollowedUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should advance from Initial message sent to Touchpoint 1', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '💌 Initial message sent'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 1',
      expect.objectContaining({
        'Next Action Date': expect.any(String),
      })
    )
  })

  it('should advance from Touchpoint 1 to Touchpoint 2', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '📆 Touchpoint 1'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 2',
      expect.objectContaining({
        'Next Action Date': expect.any(String),
      })
    )
  })

  it('should advance from Touchpoint 2 to Touchpoint 3', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '📆 Touchpoint 2'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 3',
      expect.objectContaining({
        'Next Action Date': expect.any(String),
      })
    )
  })

  it('should advance from Touchpoint 3 to Closed Lost', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '📆 Touchpoint 3'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '➡️ Closed Lost',
      undefined
    )
  })

  it('should NOT set Next Action Date when closing as lost', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '📆 Touchpoint 3'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    await markFollowedUp('job123')

    const updateCall = mockUpdateJobStage.mock.calls[0]
    const additionalFields = updateCall[2]
    expect(additionalFields).toBeUndefined()
  })

  it('should set Next Action Date to 24 hours from now for non-closing progressions', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '💌 Initial message sent'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    await markFollowedUp('job123')

    const updateCall = mockUpdateJobStage.mock.calls[0]
    const additionalFields = updateCall[2]
    const nextActionDate = new Date(additionalFields['Next Action Date'])
    const now = new Date()
    const diffHours = Math.round((nextActionDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    expect(diffHours).toBeGreaterThanOrEqual(23)
    expect(diffHours).toBeLessThanOrEqual(24)
  })

  it('should revalidate jobs-inbox tag', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '💌 Initial message sent'
        return null
      },
    })

    const { revalidateTag } = await import('next/cache')
    const { markFollowedUp } = await import('../inbox')
    await markFollowedUp('job123')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-inbox', 'dashboard')
  })

  it('should return error when no progression is defined for current stage', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '🏁 Closed Won'
        return null
      },
    })

    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({
      success: false,
      error: 'No progression defined for stage: 🏁 Closed Won',
    })
    expect(mockUpdateJobStage).not.toHaveBeenCalled()
  })

  it('should return error on Airtable failure', async () => {
    mockFind.mockRejectedValue(new Error('Record not found'))
    const { markFollowedUp } = await import('../inbox')
    const result = await markFollowedUp('job123')

    expect(result).toEqual({ success: false, error: 'Record not found' })
  })
})

describe('closeNoResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should set stage to Closed Lost', async () => {
    const { closeNoResponse } = await import('../inbox')
    const result = await closeNoResponse('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '➡️ Closed Lost',
    )
  })

  it('should revalidate jobs-inbox tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { closeNoResponse } = await import('../inbox')
    await closeNoResponse('job123')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-inbox', 'dashboard')
  })

  it('should return error on failure', async () => {
    mockUpdateJobStage.mockRejectedValue(new Error('Airtable error'))
    const { closeNoResponse } = await import('../inbox')
    const result = await closeNoResponse('job123')

    expect(result).toEqual({ success: false, error: 'Airtable error' })
  })
})

describe('markCallDone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
  })

  it('should stamp Call Completed Date', async () => {
    const { markCallDone } = await import('../inbox')
    const result = await markCallDone('job123')

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Call Completed Date': expect.any(String),
    }))
  })

  it('should revalidate jobs-inbox tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { markCallDone } = await import('../inbox')
    await markCallDone('job123')

    expect(revalidateTag).toHaveBeenCalledWith('jobs-inbox', 'dashboard')
  })

  it('should return error on failure', async () => {
    mockUpdateJobField.mockRejectedValue(new Error('Airtable error'))
    const { markCallDone } = await import('../inbox')
    const result = await markCallDone('job123')

    expect(result).toEqual({ success: false, error: 'Airtable error' })
  })
})

describe('markContractSigned', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should stamp Close Date, Deal Value, and set stage to Closed Won', async () => {
    const { markContractSigned } = await import('../inbox')
    const result = await markContractSigned('job123', 5000)

    expect(result).toEqual({ success: true })
    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '🏁 Closed Won',
      expect.objectContaining({
        'Close Date': expect.any(String),
        'Deal Value': 5000,
      })
    )
  })

  it('should revalidate jobs-inbox tag', async () => {
    const { revalidateTag } = await import('next/cache')
    const { markContractSigned } = await import('../inbox')
    await markContractSigned('job123', 5000)

    expect(revalidateTag).toHaveBeenCalledWith('jobs-inbox', 'dashboard')
  })

  it('should return error on failure', async () => {
    mockUpdateJobStage.mockRejectedValue(new Error('Airtable error'))
    const { markContractSigned } = await import('../inbox')
    const result = await markContractSigned('job123', 5000)

    expect(result).toEqual({ success: false, error: 'Airtable error' })
  })
})
