import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
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
    await logResponse('job123', 'Message')

    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Response Date': expect.any(String),
      'Response Type': 'Message',
    }))
  })

  it('should set Light Engagement stage for hot lead types (Shortlist)', async () => {
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Shortlist')

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

  it('should revalidate /inbox path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { logResponse } = await import('../inbox')
    await logResponse('job123', 'Message')

    expect(revalidatePath).toHaveBeenCalledWith('/inbox')
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
    await markFollowedUp('job123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 1',
      expect.objectContaining({
        'Last Follow Up Date': expect.any(String),
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
    await markFollowedUp('job123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 2',
      expect.objectContaining({
        'Last Follow Up Date': expect.any(String),
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
    await markFollowedUp('job123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '📆 Touchpoint 3',
      expect.objectContaining({
        'Last Follow Up Date': expect.any(String),
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
    await markFollowedUp('job123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '➡️ Closed Lost',
      expect.objectContaining({
        'Last Follow Up Date': expect.any(String),
      })
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
    expect(additionalFields).not.toHaveProperty('Next Action Date')
  })

  it('should set Next Action Date to 3 days from now for non-closing progressions', async () => {
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
    const diffDays = Math.round((nextActionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(2)
    expect(diffDays).toBeLessThanOrEqual(3)
  })

  it('should revalidate /inbox path', async () => {
    mockFind.mockResolvedValue({
      id: 'job123',
      get: (field: string) => {
        if (field === 'Stage') return '💌 Initial message sent'
        return null
      },
    })

    const { revalidatePath } = await import('next/cache')
    const { markFollowedUp } = await import('../inbox')
    await markFollowedUp('job123')

    expect(revalidatePath).toHaveBeenCalledWith('/inbox')
  })
})

describe('closeNoResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should set stage to Closed Lost and lost reason to No response', async () => {
    const { closeNoResponse } = await import('../inbox')
    await closeNoResponse('job123')

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '➡️ Closed Lost',
      { 'Lost Reason': 'No response' }
    )
  })

  it('should revalidate /inbox path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { closeNoResponse } = await import('../inbox')
    await closeNoResponse('job123')

    expect(revalidatePath).toHaveBeenCalledWith('/inbox')
  })
})

describe('markCallDone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobField.mockResolvedValue(undefined)
  })

  it('should stamp Call Completed Date', async () => {
    const { markCallDone } = await import('../inbox')
    await markCallDone('job123')

    expect(mockUpdateJobField).toHaveBeenCalledWith('job123', expect.objectContaining({
      'Call Completed Date': expect.any(String),
    }))
  })

  it('should revalidate /inbox path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { markCallDone } = await import('../inbox')
    await markCallDone('job123')

    expect(revalidatePath).toHaveBeenCalledWith('/inbox')
  })
})

describe('markContractSigned', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateJobStage.mockResolvedValue(undefined)
  })

  it('should stamp Close Date, Deal Value, and set stage to Closed Won', async () => {
    const { markContractSigned } = await import('../inbox')
    await markContractSigned('job123', 5000)

    expect(mockUpdateJobStage).toHaveBeenCalledWith(
      'job123',
      '🏁 Closed Won',
      expect.objectContaining({
        'Close Date': expect.any(String),
        'Deal Value': 5000,
      })
    )
  })

  it('should revalidate /inbox path', async () => {
    const { revalidatePath } = await import('next/cache')
    const { markContractSigned } = await import('../inbox')
    await markContractSigned('job123', 5000)

    expect(revalidatePath).toHaveBeenCalledWith('/inbox')
  })
})
