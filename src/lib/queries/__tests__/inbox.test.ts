import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock functions
const mockAll = vi.fn()
const mockSelect = vi.fn(() => ({ all: mockAll }))
const mockFind = vi.fn()
const mockUpdate = vi.fn()
const mockBaseCall = vi.fn(() => ({ select: mockSelect, find: mockFind, update: mockUpdate }))

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

describe('getHotLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by response type IN hot leads AND not closed stages', async () => {
    mockAll.mockResolvedValue([])

    const { getHotLeads } = await import('../inbox')
    await getHotLeads()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Shortlist'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Interview'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Hire'),
      })
    )
    // Should exclude closed stages
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Closed Won'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Closed Lost'),
      })
    )
  })

  it('should sort by Scraped At descending', async () => {
    mockAll.mockResolvedValue([])

    const { getHotLeads } = await import('../inbox')
    await getHotLeads()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Scraped At', direction: 'desc' }],
      })
    )
  })

  it('should map records to Job type correctly', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Hot Lead Job',
            'Job Description': 'A hot lead',
            'Stage': '🧐 Light Engagement',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Applied At': '2026-02-08T10:00:00Z',
            'Response Date': '2026-02-09T10:00:00Z',
            'Response Type': 'Shortlist',
            'Next Action Date': '2026-02-12T10:00:00Z',
            'Last Follow Up Date': null,
            'Prototype URL': 'https://proto.example.com',
            'Job URL': 'https://upwork.com/job/1',
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript',
            'Client': 'Test Client',
            'Loom URL': 'https://loom.com/share/abc',
            'Deal Value': 1000,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getHotLeads } = await import('../inbox')
    const jobs = await getHotLeads()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec1',
      jobId: 'job1',
      title: 'Hot Lead Job',
      description: 'A hot lead',
      stage: '🧐 Light Engagement',
      scrapedAt: '2026-02-10T10:00:00Z',
      appliedAt: '2026-02-08T10:00:00Z',
      responseDate: '2026-02-09T10:00:00Z',
      responseType: 'Shortlist',
      jobUrl: 'https://upwork.com/job/1',
      budgetAmount: 500,
      budgetType: 'Fixed',
      skills: 'React, TypeScript',
      client: 'Test Client',
      loomUrl: 'https://loom.com/share/abc',
      dealValue: 1000,
    })
  })

  it('should return empty array when no matches', async () => {
    mockAll.mockResolvedValue([])

    const { getHotLeads } = await import('../inbox')
    const jobs = await getHotLeads()

    expect(jobs).toEqual([])
  })
})

describe('getAwaitingResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by follow-up stages AND no response date', async () => {
    mockAll.mockResolvedValue([])

    const { getAwaitingResponse } = await import('../inbox')
    await getAwaitingResponse()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Initial message sent'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Touchpoint 1'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Response Date'),
      })
    )
  })

  it('should sort by Applied At ascending', async () => {
    mockAll.mockResolvedValue([])

    const { getAwaitingResponse } = await import('../inbox')
    await getAwaitingResponse()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Applied At', direction: 'asc' }],
      })
    )
  })

  it('should return empty array when no matches', async () => {
    mockAll.mockResolvedValue([])

    const { getAwaitingResponse } = await import('../inbox')
    const jobs = await getAwaitingResponse()

    expect(jobs).toEqual([])
  })

  it('should map records to Job type correctly', async () => {
    const mockRecords = [
      {
        id: 'rec2',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job2',
            'Job Title': 'Awaiting Job',
            'Job Description': 'Waiting for response',
            'Stage': '💌 Initial message sent',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Applied At': '2026-02-09T10:00:00Z',
            'Response Date': null,
            'Response Type': null,
            'Next Action Date': '2026-02-13T10:00:00Z',
            'Last Follow Up Date': null,
            'Prototype URL': null,
            'Job URL': 'https://upwork.com/job/2',
            'Budget Amount': 300,
            'Budget Type': 'Hourly',
            'Skills': 'Python',
            'Client': 'Another Client',
            'Loom URL': null,
            'Deal Value': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getAwaitingResponse } = await import('../inbox')
    const jobs = await getAwaitingResponse()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec2',
      jobId: 'job2',
      title: 'Awaiting Job',
      stage: '💌 Initial message sent',
      appliedAt: '2026-02-09T10:00:00Z',
      budgetAmount: 300,
      client: 'Another Client',
    })
  })
})

describe('getFollowUpsDue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by applied + no response + next action date <= today + not closed', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUpsDue } = await import('../inbox')
    await getFollowUpsDue()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Applied At'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Response Date'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Next Action Date'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('TODAY()'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Closed Won'),
      })
    )
  })

  it('should sort by Next Action Date ascending', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUpsDue } = await import('../inbox')
    await getFollowUpsDue()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Next Action Date', direction: 'asc' }],
      })
    )
  })

  it('should return empty array when no matches', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUpsDue } = await import('../inbox')
    const jobs = await getFollowUpsDue()

    expect(jobs).toEqual([])
  })

  it('should map records to Job type correctly', async () => {
    const mockRecords = [
      {
        id: 'rec3',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job3',
            'Job Title': 'Follow Up Job',
            'Job Description': 'Needs follow up',
            'Stage': '📆 Touchpoint 1',
            'Scraped At': '2026-02-05T10:00:00Z',
            'Applied At': '2026-02-06T10:00:00Z',
            'Response Date': null,
            'Response Type': null,
            'Next Action Date': '2026-02-10T10:00:00Z',
            'Last Follow Up Date': '2026-02-07T10:00:00Z',
            'Prototype URL': null,
            'Job URL': 'https://upwork.com/job/3',
            'Budget Amount': 750,
            'Budget Type': 'Fixed',
            'Skills': 'Node.js',
            'Client': 'Follow Up Client',
            'Loom URL': null,
            'Deal Value': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getFollowUpsDue } = await import('../inbox')
    const jobs = await getFollowUpsDue()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec3',
      jobId: 'job3',
      title: 'Follow Up Job',
      stage: '📆 Touchpoint 1',
      nextActionDate: '2026-02-10T10:00:00Z',
      lastFollowUpDate: '2026-02-07T10:00:00Z',
    })
  })
})
