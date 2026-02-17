import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock functions — includes mockFind to verify N+1 is eliminated
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

describe('getReadyToSend - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by deployed and prototype built stages with blank Applied At', async () => {
    mockAll.mockResolvedValue([])

    const { getReadyToSend } = await import('../ready-to-send')
    await getReadyToSend()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Deployed'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Prototype Built'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Applied At'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('BLANK()'),
      })
    )
  })

  it('should sort by scraped at ascending (oldest first)', async () => {
    mockAll.mockResolvedValue([])

    const { getReadyToSend } = await import('../ready-to-send')
    await getReadyToSend()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Scraped At', direction: 'asc' }],
      })
    )
  })

  it('should map job records using Lookup fields', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a dashboard',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'AI Cover Letter': 'Dear hiring manager...',
            'AI Loom Outline': 'Walk through the prototype...',
            'Job URL': 'https://upwork.com/jobs/123',
            'Loom URL': 'https://loom.com/share/abc',
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript',
            'Prototype URL': 'https://proto.example.com',
            // Lookup fields from Build Details
            'Prototype URL (from Build Details)': ['https://build-proto.example.com'],
            'Brief YAML (from Build Details)': ['template: dashboard'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec123',
      jobId: 'recABC1234567890D',
      title: 'Build CRM Dashboard',
      description: 'Create a dashboard',
      stage: '🏗️ Deployed',
      scrapedAt: '2026-02-10T10:00:00Z',
      coverLetter: 'Dear hiring manager...',
      aiLoomOutline: 'Walk through the prototype...',
      jobUrl: 'https://upwork.com/jobs/123',
      loomUrl: 'https://loom.com/share/abc',
      budgetAmount: 500,
      budgetType: 'Fixed',
      skills: 'React, TypeScript',
    })
  })

  it('should prefer Jobs Pipeline Prototype URL over Lookup field', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC',
            'Job Title': 'Test Job',
            'Job Description': 'Test desc',
            'Stage': '🎁 Prototype Built',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Prototype URL': 'https://job-proto.example.com',
            'Prototype URL (from Build Details)': ['https://build-proto.example.com'],
            'Brief YAML (from Build Details)': ['template: web_app'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    // Should prefer Jobs Pipeline field over Lookup field
    expect(jobs[0].prototypeUrl).toBe('https://job-proto.example.com')
  })

  it('should fall back to Lookup Prototype URL when Jobs Pipeline field is empty', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC',
            'Job Title': 'Test Job',
            'Job Description': 'Test desc',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Prototype URL': undefined,
            'Prototype URL (from Build Details)': ['https://build-proto.example.com'],
            'Brief YAML (from Build Details)': ['template: dashboard'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs[0].prototypeUrl).toBe('https://build-proto.example.com')
  })
})

describe('getReadyToSend - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return empty array when no records found', async () => {
    mockAll.mockResolvedValue([])

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs).toEqual([])
  })

  it('should handle records with no Lookup field values', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC',
            'Job Title': 'Test Job',
            'Job Description': 'Test desc',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Prototype URL': 'https://proto.example.com',
            'Prototype URL (from Build Details)': undefined,
            'Brief YAML (from Build Details)': undefined,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Test Job')
  })

  it('should handle missing optional fields gracefully', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC',
            'Job Title': 'Minimal Job',
            'Job Description': '',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs[0].coverLetter).toBeUndefined()
    expect(jobs[0].loomUrl).toBeUndefined()
    expect(jobs[0].jobUrl).toBeUndefined()
    expect(jobs[0].budgetAmount).toBeUndefined()
  })

  it('should never call Build Details find (N+1 eliminated)', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Job 1',
            'Job Description': '',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Prototype URL': 'https://proto1.example.com',
            'Brief YAML (from Build Details)': ['template: dashboard'],
          }
          return data[field]
        },
      },
      {
        id: 'rec2',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job2',
            'Job Title': 'Job 2',
            'Job Description': '',
            'Stage': '🎁 Prototype Built',
            'Scraped At': '2026-02-11T10:00:00Z',
            'Prototype URL': 'https://proto2.example.com',
            'Brief YAML (from Build Details)': ['template: web_app'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs).toHaveLength(2)
    // The critical assertion: mockFind should never be called.
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('should handle both prototype URLs being null', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'No Proto Job',
            'Job Description': '',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Prototype URL': undefined,
            'Prototype URL (from Build Details)': undefined,
            'Brief YAML (from Build Details)': undefined,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs[0].prototypeUrl).toBeUndefined()
  })

  it('should parse template from JSON brief', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'JSON Brief Job',
            'Job Description': '',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Brief YAML (from Build Details)': ['{"template": "web_app"}'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs[0].template).toBe('web_app')
  })

  it('should return unknown template for unrecognized values', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Unknown Template Job',
            'Job Description': '',
            'Stage': '🏗️ Deployed',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Brief YAML (from Build Details)': ['{"template": "mobile_app"}'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    expect(jobs[0].template).toBe('unknown')
  })
})
