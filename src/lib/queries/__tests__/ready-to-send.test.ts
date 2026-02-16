import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Job } from '@/types/brief'

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

  it('should fetch and map job records with build details', async () => {
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
            'Build Details': ['buildRec1'],
            'AI Cover Letter': 'Dear hiring manager...',
            'AI Loom Outline': 'Walk through the prototype...',
            'Job URL': 'https://upwork.com/jobs/123',
            'Loom URL': 'https://loom.com/share/abc',
            'Budget Amount': 500,
            'Budget Type': 'Fixed',
            'Skills': 'React, TypeScript',
            'Applied At': undefined,
            'Prototype URL': 'https://proto.example.com',
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)
    mockFind.mockResolvedValue({
      id: 'buildRec1',
      fields: {
        'Prototype URL': 'https://build-proto.example.com',
        'Brief YAML': 'template: dashboard',
      },
    })

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

  it('should fetch prototype URL from Build Details', async () => {
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
            'Build Details': ['buildRec1'],
            'Prototype URL': 'https://job-proto.example.com',
          }
          return data[field]
        },
      },
    ]

    mockAll.mockResolvedValue(mockRecords)
    mockFind.mockResolvedValue({
      id: 'buildRec1',
      fields: {
        'Prototype URL': 'https://build-proto.example.com',
        'Brief YAML': 'template: web_app',
      },
    })

    const { getReadyToSend } = await import('../ready-to-send')
    const jobs = await getReadyToSend()

    // Should use Prototype URL from Jobs Pipeline first, or Build Details as fallback
    expect(jobs[0].prototypeUrl).toBeDefined()
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

  it('should handle records with no Build Details', async () => {
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
            'Build Details': null,
            'Prototype URL': 'https://proto.example.com',
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
            'Build Details': null,
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
})
