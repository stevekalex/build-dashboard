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

describe('getActiveDeals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by engagement stages', async () => {
    mockAll.mockResolvedValue([])

    const { getActiveDeals } = await import('../closing')
    await getActiveDeals()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Light Engagement'),
      })
    )
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Engagement with prototype'),
      })
    )
  })

  it('should sort by Scraped At ascending', async () => {
    mockAll.mockResolvedValue([])

    const { getActiveDeals } = await import('../closing')
    await getActiveDeals()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Scraped At', direction: 'asc' }],
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
            'Job Title': 'Deal in Progress',
            'Job Description': 'A closing deal',
            'Stage': '🧐 Light Engagement',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Applied At': '2026-02-08T10:00:00Z',
            'Response Date': '2026-02-09T10:00:00Z',
            'Response Type': 'Interview',
            'Job URL': 'https://upwork.com/job/1',
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript',
            'Client': 'Test Client',
            'Call Completed Date': '2026-02-11T10:00:00Z',
            'Contract Sent Date': null,
            'Deal Value': 2000,
            'Close Date': null,
            'Lost Reason': null,
            'Loom URL': null,
            'Prototype URL': null,
            'Next Action Date': null,
            'Last Follow Up Date': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getActiveDeals } = await import('../closing')
    const jobs = await getActiveDeals()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec1',
      jobId: 'job1',
      title: 'Deal in Progress',
      description: 'A closing deal',
      stage: '🧐 Light Engagement',
      scrapedAt: '2026-02-10T10:00:00Z',
      responseType: 'Interview',
      budgetAmount: 500,
      budgetType: 'Fixed',
      client: 'Test Client',
      callCompletedDate: '2026-02-11T10:00:00Z',
      dealValue: 2000,
    })
  })

  it('should return empty array when no matches', async () => {
    mockAll.mockResolvedValue([])

    const { getActiveDeals } = await import('../closing')
    const jobs = await getActiveDeals()

    expect(jobs).toEqual([])
  })

  it('should return empty array on error', async () => {
    mockAll.mockRejectedValue(new Error('Airtable error'))

    const { getActiveDeals } = await import('../closing')
    const jobs = await getActiveDeals()

    expect(jobs).toEqual([])
  })
})

describe('groupDealsByStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should put engagement-stage jobs without call/contract into engaged', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const jobs = [
      {
        id: 'rec1',
        jobId: 'job1',
        title: 'Engaged Deal',
        description: '',
        stage: '🧐 Light Engagement',
        scrapedAt: '2026-02-10T10:00:00Z',
      },
    ]
    const grouped = groupDealsByStatus(jobs)

    expect(grouped.engaged).toHaveLength(1)
    expect(grouped.callDone).toHaveLength(0)
    expect(grouped.contractSent).toHaveLength(0)
    expect(grouped.won).toHaveLength(0)
  })

  it('should put jobs with Call Completed Date into callDone', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const jobs = [
      {
        id: 'rec2',
        jobId: 'job2',
        title: 'Call Done Deal',
        description: '',
        stage: '🕺 Engagement with prototype',
        scrapedAt: '2026-02-10T10:00:00Z',
        callCompletedDate: '2026-02-11T10:00:00Z',
      },
    ]
    const grouped = groupDealsByStatus(jobs)

    expect(grouped.engaged).toHaveLength(0)
    expect(grouped.callDone).toHaveLength(1)
    expect(grouped.contractSent).toHaveLength(0)
    expect(grouped.won).toHaveLength(0)
  })

  it('should put jobs with Contract Sent Date into contractSent', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const jobs = [
      {
        id: 'rec3',
        jobId: 'job3',
        title: 'Contract Sent Deal',
        description: '',
        stage: '🕺 Engagement with prototype',
        scrapedAt: '2026-02-10T10:00:00Z',
        callCompletedDate: '2026-02-11T10:00:00Z',
        contractSentDate: '2026-02-12T10:00:00Z',
      },
    ]
    const grouped = groupDealsByStatus(jobs)

    expect(grouped.engaged).toHaveLength(0)
    expect(grouped.callDone).toHaveLength(0)
    expect(grouped.contractSent).toHaveLength(1)
    expect(grouped.won).toHaveLength(0)
  })

  it('should put Closed Won jobs into won', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const jobs = [
      {
        id: 'rec4',
        jobId: 'job4',
        title: 'Won Deal',
        description: '',
        stage: '🏁 Closed Won',
        scrapedAt: '2026-02-10T10:00:00Z',
        closeDate: twoDaysAgo.toISOString(),
      },
    ]
    const grouped = groupDealsByStatus(jobs)

    expect(grouped.engaged).toHaveLength(0)
    expect(grouped.callDone).toHaveLength(0)
    expect(grouped.contractSent).toHaveLength(0)
    expect(grouped.won).toHaveLength(1)
  })

  it('should handle empty input', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const grouped = groupDealsByStatus([])

    expect(grouped.engaged).toHaveLength(0)
    expect(grouped.callDone).toHaveLength(0)
    expect(grouped.contractSent).toHaveLength(0)
    expect(grouped.won).toHaveLength(0)
  })

  it('should correctly distribute multiple jobs across categories', async () => {
    const { groupDealsByStatus } = await import('../closing')
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    const jobs = [
      {
        id: 'rec1',
        jobId: 'job1',
        title: 'Engaged',
        description: '',
        stage: '🧐 Light Engagement',
        scrapedAt: '2026-02-10T10:00:00Z',
      },
      {
        id: 'rec2',
        jobId: 'job2',
        title: 'Call Done',
        description: '',
        stage: '🕺 Engagement with prototype',
        scrapedAt: '2026-02-10T10:00:00Z',
        callCompletedDate: '2026-02-11T10:00:00Z',
      },
      {
        id: 'rec3',
        jobId: 'job3',
        title: 'Contract Sent',
        description: '',
        stage: '🕺 Engagement with prototype',
        scrapedAt: '2026-02-10T10:00:00Z',
        callCompletedDate: '2026-02-11T10:00:00Z',
        contractSentDate: '2026-02-12T10:00:00Z',
      },
      {
        id: 'rec4',
        jobId: 'job4',
        title: 'Won',
        description: '',
        stage: '🏁 Closed Won',
        scrapedAt: '2026-02-10T10:00:00Z',
        closeDate: oneDayAgo.toISOString(),
      },
    ]
    const grouped = groupDealsByStatus(jobs)

    expect(grouped.engaged).toHaveLength(1)
    expect(grouped.engaged[0].title).toBe('Engaged')
    expect(grouped.callDone).toHaveLength(1)
    expect(grouped.callDone[0].title).toBe('Call Done')
    expect(grouped.contractSent).toHaveLength(1)
    expect(grouped.contractSent[0].title).toBe('Contract Sent')
    expect(grouped.won).toHaveLength(1)
    expect(grouped.won[0].title).toBe('Won')
  })
})
