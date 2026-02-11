import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Brief } from '@/types/brief'

// Create mock functions
const mockAll = vi.fn()
const mockSelect = vi.fn(() => ({ all: mockAll }))
const mockBaseCall = vi.fn(() => ({ select: mockSelect }))

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

  it('should fetch briefs with pending approval status', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a dashboard',
            Created: '2026-02-10T10:00:00Z',
            'Build Details': [
              {
                fields: {
                  Buildable: true,
                  Brief: 'template: dashboard',
                  Template: 'dashboard',
                  Status: 'Evaluated',
                },
              },
            ],
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

  it('should handle briefs with no build details', async () => {
    const mockRecords = [
      {
        id: 'rec123',
        get: (field: string) => {
          const data: Record<string, any> = {
            'Job ID': 'recABC1234567890D',
            'Job Title': 'Build CRM Dashboard',
            'Job Description': 'Create a dashboard',
            Created: '2026-02-10T10:00:00Z',
            'Build Details': null,
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
            Created: '2026-02-10T10:00:00Z',
            'Build Details': [
              {
                fields: {
                  Buildable: true,
                  Brief: 'test',
                  Template: 'dashboard',
                  Status: 'Evaluated',
                },
              },
            ],
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
})
