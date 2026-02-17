import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock functions
const mockAll = vi.fn()
const mockSelect = vi.fn(() => ({ all: mockAll }))
const mockFind = vi.fn()
const mockBaseCall = vi.fn(() => ({ select: mockSelect, find: mockFind }))

// Mock Airtable module
vi.mock('airtable', () => {
  return {
    default: class {
      base() {
        return mockBaseCall
      }
    },
  }
})

describe('Airtable Integration - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should fetch briefs with pending approval status using Lookup fields', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a dashboard',
            'Scraped At': '2026-02-10T10:00:00Z',
            // Lookup fields from Build Details
            'Build: Buildable': [true],
            'Build: Brief YAML': ['template: dashboard'],
            'Build: Status': ['Evaluated'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs).toHaveLength(1)
    expect(briefs[0]).toMatchObject({
      id: 'rec123',
      jobId: 'recABC1234567890D',
      title: 'Build CRM Dashboard',
      buildable: true,
    })
  })

  it('should filter by pending approval stage', async () => {
    mockAll.mockResolvedValue([])

    const { getBriefsPendingApproval } = await import('../airtable')
    await getBriefsPendingApproval()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Pending Approval'),
      })
    )
  })

  it('should fetch a single brief by ID using Lookup fields', async () => {
    mockFind.mockResolvedValue({
      id: 'rec123',
      get: (field: string) => {
        const data: Record<string, any> = {
          'Job ID': 'recABC1234567890D',
          'Job Title': 'Build CRM Dashboard',
          'Job Description': 'Create a dashboard',
          'Scraped At': '2026-02-10T10:00:00Z',
          'Build: Buildable': [true],
          'Build: Brief YAML': ['{"template": "dashboard"}'],
          'Build: Status': ['Evaluated'],
        }
        return data[field]
      },
    })

    const { getBriefById } = await import('../airtable')
    const brief = await getBriefById('rec123')

    expect(brief).not.toBeNull()
    expect(brief!.id).toBe('rec123')
    expect(brief!.buildable).toBe(true)
    expect(brief!.template).toBe('dashboard')
    // Should only make 1 API call (no secondary Build Details fetch)
    expect(mockFind).toHaveBeenCalledTimes(1)
  })
})

describe('Airtable Integration - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should handle briefs with empty Lookup fields', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a dashboard',
            'Scraped At': '2026-02-10T10:00:00Z',
            // Lookup fields are empty (no linked Build Details)
            'Build: Buildable': undefined,
            'Build: Brief YAML': undefined,
            'Build: Status': undefined,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs).toHaveLength(1)
    expect(briefs[0].buildable).toBe(false)
    expect(briefs[0].brief).toBe('')
  })

  it('should handle missing job description', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': null,
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build: Buildable': [true],
            'Build: Brief YAML': ['test'],
            'Build: Status': ['Evaluated'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].description).toBe('')
  })

  it('should return empty array if no records found', async () => {
    mockAll.mockResolvedValue([])

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs).toEqual([])
  })

  it('should handle Airtable API errors', async () => {
    mockAll.mockRejectedValue(new Error('API Error'))

    const { getBriefsPendingApproval } = await import('../airtable')

    await expect(getBriefsPendingApproval()).rejects.toThrow('API Error')
  })

  it('should return null for non-existent brief ID', async () => {
    mockFind.mockRejectedValue(new Error('NOT_FOUND'))

    const { getBriefById } = await import('../airtable')
    const brief = await getBriefById('nonexistent')

    expect(brief).toBeNull()
  })
})

describe('getAllBuilds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by approved, deployed, and build failed stages', async () => {
    mockAll.mockResolvedValue([])

    const { getAllBuilds } = await import('../airtable')
    await getAllBuilds()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Approved'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Deployed'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Build Failed'),
      })
    )
  })

  it('should limit to 37 records sorted by most recent', async () => {
    mockAll.mockResolvedValue([])

    const { getAllBuilds } = await import('../airtable')
    await getAllBuilds()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRecords: 37,
        sort: [{ field: 'Scraped At', direction: 'desc' }],
      })
    )
  })

  it('should map builds using Lookup fields without N+1', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Built Dashboard',
            'Job Description': 'A dashboard build',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Stage': '🏗️ Deployed',
            // Lookup fields
            'Build: Status': ['Completed'],
            'Build: Build Started': ['2026-02-10T10:05:00Z'],
            'Build: Build Completed': ['2026-02-10T10:50:00Z'],
            'Build: Build Duration': [45],
            'Build: Prototype URL': ['https://proto.example.com'],
            'Build: Build Error': undefined,
            'Build: Brief YAML': ['{"template": "dashboard"}'],
          }
          return data[field]
        },
      },
      {
        id: 'rec2',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job2',
            'Job Title': 'Failed Build',
            'Job Description': 'A failed build',
            'Scraped At': '2026-02-09T10:00:00Z',
            'Stage': '⚠️ Build Failed',
            'Build: Status': ['Failed'],
            'Build: Build Started': ['2026-02-09T10:05:00Z'],
            'Build: Build Completed': undefined,
            'Build: Build Duration': undefined,
            'Build: Prototype URL': undefined,
            'Build: Build Error': ['Timeout after 60 minutes'],
            'Build: Brief YAML': ['template: web_app'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getAllBuilds } = await import('../airtable')
    const builds = await getAllBuilds()

    expect(builds).toHaveLength(2)

    // First build — completed
    expect(builds[0]).toMatchObject({
      id: 'rec1',
      jobId: 'job1',
      title: 'Built Dashboard',
      stage: 'deployed',
      status: 'completed',
      template: 'dashboard',
      buildStarted: '2026-02-10T10:05:00Z',
      buildCompleted: '2026-02-10T10:50:00Z',
      buildDuration: 45,
      prototypeUrl: 'https://proto.example.com',
    })
    expect(builds[0].buildError).toBeUndefined()

    // Second build — failed
    expect(builds[1]).toMatchObject({
      id: 'rec2',
      stage: 'failed',
      status: 'failed',
      buildError: 'Timeout after 60 minutes',
    })
    expect(builds[1].prototypeUrl).toBeUndefined()

    // N+1 eliminated: mockFind should never be called
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('should handle builds with missing Lookup fields', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Bare Build',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Stage': '✅ Approved',
            // All Lookup fields undefined
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getAllBuilds } = await import('../airtable')
    const builds = await getAllBuilds()

    expect(builds).toHaveLength(1)
    expect(builds[0].status).toBe('building') // default fallback
    expect(builds[0].buildStarted).toBeUndefined()
    expect(builds[0].buildDuration).toBeUndefined()
    expect(builds[0].prototypeUrl).toBeUndefined()
    expect(builds[0].buildError).toBeUndefined()
  })
})

describe('Lookup field helpers (via getBriefsPendingApproval)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lookupBoolean: should return false for undefined', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build: Buildable': undefined,
            'Build: Brief YAML': undefined,
            'Build: Status': undefined,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].buildable).toBe(false)
  })

  it('lookupBoolean: should return false for [false]', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build: Buildable': [false],
            'Build: Brief YAML': [],
            'Build: Status': [],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].buildable).toBe(false)
  })

  it('lookupBoolean: should return true for [true]', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build: Buildable': [true],
            'Build: Brief YAML': [],
            'Build: Status': [],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].buildable).toBe(true)
  })

  it('lookupString: should return undefined for empty array', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build: Buildable': [true],
            'Build: Brief YAML': [],
            'Build: Status': [],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].brief).toBe('')
    expect(briefs[0].status).toBe('pending') // mapStatus fallback for undefined
  })
})

describe('Status mapping (via getBriefsPendingApproval)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const makeRecord = (status: string) => ({
    id: 'rec1',
    get: (field: string) => {
      const data: Record<string, any> = {
        'Job ID': 'job1',
        'Job Title': 'Test',
        'Job Description': '',
        'Scraped At': '2026-02-10T10:00:00Z',
        'Build: Buildable': [true],
        'Build: Brief YAML': [],
        'Build: Status': [status],
      }
      return data[field]
    },
  })

  it.each([
    ['Evaluated', 'pending'],
    ['Building', 'building'],
    ['Completed', 'complete'],
    ['Failed', 'failed'],
    ['Approved', 'approved'],
    ['SomethingUnknown', 'pending'], // unmapped defaults to pending
  ])('should map Airtable status "%s" to "%s"', async (airtableStatus, expectedStatus) => {
    mockAll.mockResolvedValue([makeRecord(airtableStatus)])

    const { getBriefsPendingApproval } = await import('../airtable')
    const briefs = await getBriefsPendingApproval()

    expect(briefs[0].status).toBe(expectedStatus)
  })
})
