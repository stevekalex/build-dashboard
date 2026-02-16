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

describe('getJobsToApprove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should filter by pending approval stage', async () => {
    mockAll.mockResolvedValue([])

    const { getJobsToApprove } = await import('../approve')
    await getJobsToApprove()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByFormula: expect.stringContaining('Pending Approval'),
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

  it('should only return buildable jobs', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Buildable Job',
            'Job Description': 'A buildable job',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build Details': ['build1'],
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript',
          }
          return data[field]
        },
      },
      {
        id: 'rec2',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job2',
            'Job Title': 'Unbuildable Job',
            'Job Description': 'An unbuildable job',
            'Scraped At': '2026-02-10T11:00:00Z',
            'Build Details': ['build2'],
            'Budget Amount': 300,
            'Budget Type': 'Hourly',
            'Skills': 'Python',
          }
          return data[field]
        },
      },
      {
        id: 'rec3',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job3',
            'Job Title': 'No Build Details Job',
            'Job Description': 'No build details',
            'Scraped At': '2026-02-10T12:00:00Z',
            'Build Details': null,
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    // build1 is buildable, build2 is not
    mockFind.mockImplementation((id: string) => {
      if (id === 'build1') {
        return Promise.resolve({
          id: 'build1',
          fields: {
            Buildable: true,
            'Buildable Reasoning': 'Clear scope',
            'Brief YAML': 'template: dashboard',
            Status: 'Evaluated',
          },
        })
      }
      if (id === 'build2') {
        return Promise.resolve({
          id: 'build2',
          fields: {
            Buildable: false,
            'Buildable Reasoning': 'Too complex',
            'Brief YAML': '',
            Status: 'Unbuildable',
          },
        })
      }
      return Promise.reject(new Error('Not found'))
    })

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    // Should only return the buildable job (rec1)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe('rec1')
    expect(jobs[0].title).toBe('Buildable Job')
    expect(jobs[0].buildable).toBe(true)
  })

  it('should return correct job fields', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a CRM dashboard',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build Details': ['build1'],
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript, Next.js',
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)
    mockFind.mockResolvedValue({
      id: 'build1',
      fields: {
        Buildable: true,
        'Buildable Reasoning': 'Clear scope and well-defined requirements',
        'Brief YAML': '{"template": "dashboard", "routes": [{"path": "/dashboard"}], "unique_interactions": "drag and drop"}',
        Status: 'Evaluated',
      },
    })

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

  it('should handle records with missing build details gracefully', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Job Without Build Details',
            'Job Description': 'No build details',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build Details': null,
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    // Jobs without build details are not buildable, so filtered out
    expect(jobs).toHaveLength(0)
  })

  it('should handle build details fetch errors gracefully', async () => {
    const mockRecords = [
      {
        id: 'rec1',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'job1',
            'Job Title': 'Job With Error',
            'Job Description': 'Fetch error',
            'Scraped At': '2026-02-10T10:00:00Z',
            'Build Details': ['build-error'],
            'Budget Amount': null,
            'Budget Type': null,
            'Skills': null,
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)
    mockFind.mockRejectedValue(new Error('Airtable error'))

    const { getJobsToApprove } = await import('../approve')
    const jobs = await getJobsToApprove()

    // Error fetching build details means not buildable, so filtered out
    expect(jobs).toHaveLength(0)
  })
})
