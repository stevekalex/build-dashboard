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

describe('getJobsToApprove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by pending approval stage and buildable', async () => {
    mockAll.mockResolvedValue([])

    const { getJobsToApprove } = await import('../approve')
    await getJobsToApprove()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Pending Approval'),
      })
    )
    // Buildable filter is now in the formula (no in-memory filtering)
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Build: Buildable'),
      })
    )
  })

  it('should sort by scraped at ascending', async () => {
    mockAll.mockResolvedValue([])

    const { getJobsToApprove } = await import('../approve')
    await getJobsToApprove()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ field: 'Scraped At', direction: 'asc' }],
      })
    )
  })

  it('should map records using Lookup fields', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a CRM dashboard',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript, Next.js',
            // Lookup fields return single-element arrays for 1-to-1 links
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': ['Clear scope and well-defined requirements'],
            'Build: Brief YAML': ['{"template": "dashboard", "routes": [{"path": "/dashboard"}], "unique_interactions": "drag and drop"}'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'rec1',
      jobId: 'job1',
      title: 'Build CRM Dashboard',
      description: 'Create a CRM dashboard',
      stage: '⏸️ Pending Approval',
      scrapedAt: '2026-02-10T10:00:00Z',
      buildable: true,
      buildableReasoning: 'Clear scope and well-defined requirements',
      brief: '{"template": "dashboard", "routes": [{"path": "/dashboard"}], "unique_interactions": "drag and drop"}',
      template: 'dashboard',
      budgetAmount: 500,
      budgetType: 'Fixed',
      skills: 'React, TypeScript, Next.js',
    })
  })

  it('should return empty array when no records found', async () => {
    mockAll.mockResolvedValue([])

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs).toEqual([])
  })

  it('should handle records with missing Lookup field values gracefully', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Minimal Job',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            // Lookup fields may be empty arrays or undefined
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': [],
            'Build: Brief YAML': [],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs).toHaveLength(1)
    expect(jobs[0].buildable).toBe(true)
    expect(jobs[0].buildableReasoning).toBe('')
    expect(jobs[0].brief).toBe('')
  })

  it('should handle Lookup fields returned as plain values (not arrays)', async () => {
    // Some Airtable configurations may return plain values instead of arrays
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test Job',
            'Job Description': 'Test',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': 'Good scope',
            'Build: Brief YAML': 'template: web_app',
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs).toHaveLength(1)
    expect(jobs[0].buildableReasoning).toBe('Good scope')
    expect(jobs[0].template).toBe('web_app')
  })

  it('should never call Build Details find (N+1 eliminated)', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Test Job',
            'Job Description': 'Test',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': ['Looks good'],
            'Build: Brief YAML': ['template: dashboard'],
          }
          return data[field]
        },
      },
      {
        id: 'rec2',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job2',
            'Job Title': 'Another Job',
            'Job Description': 'Another test',
            'Scraped At': '2026-02-11T10:00:00Z',
            'Budget Amount': 300,
            'Budget Type': 'Hourly',
            'Skills': 'Python',
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': ['Clear scope'],
            'Build: Brief YAML': ['template: web_app'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs).toHaveLength(2)
    // The critical assertion: mockFind should never be called.
    // Previously, each record triggered a separate Build Details .find() call.
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('should fall back to record.id when Job ID is missing', async () => {
    const mockRecords = [
      {
        id: 'recFallback',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': null,
            'Job Title': 'No Job ID',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': [],
            'Build: Brief YAML': [],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs[0].jobId).toBe('recFallback')
  })

  it('should parse YAML brief data correctly', async () => {
    const yamlBrief = `template: web_app
routes:
  - path: /home
  - path: /about
unique_interactions: drag and drop`

    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'YAML Brief Job',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': ['Good'],
            'Build: Brief YAML': [yamlBrief],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    expect(jobs[0].template).toBe('web_app')
    expect(jobs[0].routes).toHaveLength(2)
    expect(jobs[0].uniqueInteractions).toBe('drag and drop')
  })

  it('should handle malformed brief YAML gracefully', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Bad Brief Job',
            'Job Description': '',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
            'Build: Buildable': [true],
            'Build: Buildable Reasoning': ['Good'],
            'Build: Brief YAML': ['{{{invalid json and yaml:::'],
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    // Should not throw — returns defaults
    expect(jobs).toHaveLength(1)
    expect(jobs[0].template).toBe('unknown')
  })
})
