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

describe('groupHotLeadsByResponseType', () => {
  it('should group jobs by response type', async () => {
    const { groupHotLeadsByResponseType } = await import('../inbox')
    const jobs = [
      { id: 'r1', jobId: 'j1', title: 'A', description: '', stage: '', scrapedAt: '', responseType: 'Shortlist' },
      { id: 'r2', jobId: 'j2', title: 'B', description: '', stage: '', scrapedAt: '', responseType: 'Interview' },
      { id: 'r3', jobId: 'j3', title: 'C', description: '', stage: '', scrapedAt: '', responseType: 'Hire' },
      { id: 'r4', jobId: 'j4', title: 'D', description: '', stage: '', scrapedAt: '', responseType: 'Shortlist' },
    ]
    const columns = groupHotLeadsByResponseType(jobs)

    expect(columns.shortlist).toHaveLength(2)
    expect(columns.interview).toHaveLength(1)
    expect(columns.hire).toHaveLength(1)
  })

  it('should return empty columns for empty input', async () => {
    const { groupHotLeadsByResponseType } = await import('../inbox')
    const columns = groupHotLeadsByResponseType([])

    expect(columns.shortlist).toHaveLength(0)
    expect(columns.interview).toHaveLength(0)
    expect(columns.hire).toHaveLength(0)
  })

  it('should ignore jobs with unknown response types', async () => {
    const { groupHotLeadsByResponseType } = await import('../inbox')
    const jobs = [
      { id: 'r1', jobId: 'j1', title: 'A', description: '', stage: '', scrapedAt: '', responseType: 'Other' },
    ]
    const columns = groupHotLeadsByResponseType(jobs)

    expect(columns.shortlist).toHaveLength(0)
    expect(columns.interview).toHaveLength(0)
    expect(columns.hire).toHaveLength(0)
  })
})

describe('groupFollowUpsByStage', () => {
  // Helper: date in the past (overdue)
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2h ago
  // Helper: date in the future (upcoming)
  const futureDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6h from now

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should put overdue Initial Message Sent jobs into overdue.followUp1', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec1', jobId: 'j1', title: 'Overdue FU1', description: '', stage: '💌 Initial message sent', scrapedAt: '', nextActionDate: pastDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.overdue.followUp1).toHaveLength(1)
    expect(grouped.overdue.followUp2).toHaveLength(0)
    expect(grouped.upcoming.followUp1).toHaveLength(0)
  })

  it('should put upcoming Touchpoint 1 jobs into upcoming.followUp2', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec2', jobId: 'j2', title: 'Upcoming FU2', description: '', stage: '📆 Touchpoint 1', scrapedAt: '', nextActionDate: futureDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.upcoming.followUp2).toHaveLength(1)
    expect(grouped.overdue.followUp2).toHaveLength(0)
  })

  it('should put overdue Touchpoint 2 jobs into overdue.followUp3', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec3', jobId: 'j3', title: 'Overdue FU3', description: '', stage: '📆 Touchpoint 2', scrapedAt: '', nextActionDate: pastDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.overdue.followUp3).toHaveLength(1)
    expect(grouped.upcoming.followUp3).toHaveLength(0)
  })

  it('should put upcoming Touchpoint 3 jobs into upcoming.closeOut', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec4', jobId: 'j4', title: 'Upcoming Close', description: '', stage: '📆 Touchpoint 3', scrapedAt: '', nextActionDate: futureDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.upcoming.closeOut).toHaveLength(1)
    expect(grouped.overdue.closeOut).toHaveLength(0)
  })

  it('should treat jobs without nextActionDate as overdue', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec5', jobId: 'j5', title: 'No Date', description: '', stage: '💌 Initial message sent', scrapedAt: '' },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.overdue.followUp1).toHaveLength(1)
    expect(grouped.upcoming.followUp1).toHaveLength(0)
  })

  it('should handle empty input', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const grouped = groupFollowUpsByStage([])

    expect(grouped.overdue.followUp1).toHaveLength(0)
    expect(grouped.overdue.followUp2).toHaveLength(0)
    expect(grouped.overdue.followUp3).toHaveLength(0)
    expect(grouped.overdue.closeOut).toHaveLength(0)
    expect(grouped.upcoming.followUp1).toHaveLength(0)
    expect(grouped.upcoming.followUp2).toHaveLength(0)
    expect(grouped.upcoming.followUp3).toHaveLength(0)
    expect(grouped.upcoming.closeOut).toHaveLength(0)
  })

  it('should correctly distribute jobs across overdue/upcoming and all columns', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'r1', jobId: 'j1', title: 'A', description: '', stage: '💌 Initial message sent', scrapedAt: '', nextActionDate: pastDate },
      { id: 'r2', jobId: 'j2', title: 'B', description: '', stage: '📆 Touchpoint 1', scrapedAt: '', nextActionDate: futureDate },
      { id: 'r3', jobId: 'j3', title: 'C', description: '', stage: '📆 Touchpoint 2', scrapedAt: '', nextActionDate: pastDate },
      { id: 'r4', jobId: 'j4', title: 'D', description: '', stage: '📆 Touchpoint 3', scrapedAt: '', nextActionDate: futureDate },
      { id: 'r5', jobId: 'j5', title: 'E', description: '', stage: '💌 Initial message sent', scrapedAt: '', nextActionDate: futureDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.overdue.followUp1).toHaveLength(1)
    expect(grouped.overdue.followUp3).toHaveLength(1)
    expect(grouped.upcoming.followUp1).toHaveLength(1)
    expect(grouped.upcoming.followUp2).toHaveLength(1)
    expect(grouped.upcoming.closeOut).toHaveLength(1)
  })

  it('should ignore jobs with unknown stages', async () => {
    const { groupFollowUpsByStage } = await import('../inbox')
    const jobs = [
      { id: 'rec1', jobId: 'j1', title: 'Unknown', description: '', stage: '🧐 Light Engagement', scrapedAt: '', nextActionDate: pastDate },
    ]
    const grouped = groupFollowUpsByStage(jobs)

    expect(grouped.overdue.followUp1).toHaveLength(0)
    expect(grouped.overdue.followUp2).toHaveLength(0)
    expect(grouped.overdue.followUp3).toHaveLength(0)
    expect(grouped.overdue.closeOut).toHaveLength(0)
  })
})

describe('getFollowUps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by follow-up stages and no response date', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUps } = await import('../inbox')
    await getFollowUps()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Response Date'),
      })
    )
    // Should NOT filter by date — shows all follow-ups, not just due today
    expect(mockSelect).not.toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('TODAY()'),
      })
    )
  })

  it('should sort by Next Action Date ascending', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUps } = await import('../inbox')
    await getFollowUps()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Next Action Date', direction: 'asc' }],
      })
    )
  })

  it('should return empty array when no matches', async () => {
    mockAll.mockResolvedValue([])

    const { getFollowUps } = await import('../inbox')
    const jobs = await getFollowUps()

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

    const { getFollowUps } = await import('../inbox')
    const jobs = await getFollowUps()

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
