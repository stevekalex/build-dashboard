import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

describe('getDailyMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return all 7 metrics', async () => {
    // Each call to countByDateToday will call select().all()
    // getDailyMetrics runs 7 queries in parallel
    mockAll.mockResolvedValue([])

    const { getDailyMetrics } = await import('../metrics')
    const metrics = await getDailyMetrics()

    expect(metrics).toHaveProperty('jobsDetected')
    expect(metrics).toHaveProperty('jobsApproved')
    expect(metrics).toHaveProperty('prototypesBuilt')
    expect(metrics).toHaveProperty('applicationsSent')
    expect(metrics).toHaveProperty('responsesReceived')
    expect(metrics).toHaveProperty('callsCompleted')
    expect(metrics).toHaveProperty('contractsSigned')
    expect(metrics).toHaveProperty('date')
  })

  it('should use IS_SAME formula with TODAY for each field', async () => {
    mockAll.mockResolvedValue([])

    const { getDailyMetrics } = await import('../metrics')
    await getDailyMetrics()

    // Should have been called 7 times (once per metric)
    expect(mockSelect).toHaveBeenCalledTimes(7)

    // Verify each formula uses IS_SAME with TODAY
    const expectedFields = [
      'Scraped At',
      'Approved Date',
      'Deployed Date',
      'Applied At',
      'Response Date',
      'Call Completed Date',
      'Close Date',
    ]

    expectedFields.forEach((field) => {
      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          filterByFormula: `IS_SAME({${field}}, TODAY(), 'day')`,
        })
      )
    })
  })

  it('should only fetch the needed field for each query', async () => {
    mockAll.mockResolvedValue([])

    const { getDailyMetrics } = await import('../metrics')
    await getDailyMetrics()

    // Each select call should include a fields array with just the one field
    const expectedFields = [
      'Scraped At',
      'Approved Date',
      'Deployed Date',
      'Applied At',
      'Response Date',
      'Call Completed Date',
      'Close Date',
    ]

    expectedFields.forEach((field) => {
      expect(mockSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: [field],
        })
      )
    })
  })

  it('should return counts based on records returned', async () => {
    // Return different counts for different calls
    let callCount = 0
    mockAll.mockImplementation(() => {
      callCount++
      // Each call returns a different number of records
      const counts = [3, 2, 1, 5, 0, 4, 1]
      const count = counts[(callCount - 1) % counts.length]
      return Promise.resolve(Array(count).fill({ id: `rec${callCount}` }))
    })

    const { getDailyMetrics } = await import('../metrics')
    const metrics = await getDailyMetrics()

    expect(metrics.jobsDetected).toBe(3)
    expect(metrics.jobsApproved).toBe(2)
    expect(metrics.prototypesBuilt).toBe(1)
    expect(metrics.applicationsSent).toBe(5)
    expect(metrics.responsesReceived).toBe(0)
    expect(metrics.callsCompleted).toBe(4)
    expect(metrics.contractsSigned).toBe(1)
  })

  it('should gracefully return 0 when a field does not exist (query fails)', async () => {
    // First call succeeds, rest fail
    let callCount = 0
    mockAll.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve([{ id: 'rec1' }, { id: 'rec2' }])
      }
      return Promise.reject(new Error('UNKNOWN_FIELD_NAME'))
    })

    const { getDailyMetrics } = await import('../metrics')
    const metrics = await getDailyMetrics()

    // First metric should be 2, all others should be 0
    expect(metrics.jobsDetected).toBe(2)
    expect(metrics.jobsApproved).toBe(0)
    expect(metrics.prototypesBuilt).toBe(0)
    expect(metrics.applicationsSent).toBe(0)
    expect(metrics.responsesReceived).toBe(0)
    expect(metrics.callsCompleted).toBe(0)
    expect(metrics.contractsSigned).toBe(0)
  })

  it('should run all 7 queries in parallel via Promise.all', async () => {
    // Track timing to verify parallelism
    const resolvers: Array<(value: any[]) => void> = []

    mockAll.mockImplementation(() => {
      return new Promise((resolve) => {
        resolvers.push(resolve)
      })
    })

    const { getDailyMetrics } = await import('../metrics')
    const metricsPromise = getDailyMetrics()

    // All 7 queries should be initiated before any resolves
    // Wait a tick for Promise.all to kick off all calls
    await new Promise((r) => setTimeout(r, 0))
    expect(resolvers).toHaveLength(7)

    // Resolve all
    resolvers.forEach((resolve) => resolve([]))

    const metrics = await metricsPromise
    expect(metrics.jobsDetected).toBe(0)
  })

  it('should include today date as ISO date string', async () => {
    mockAll.mockResolvedValue([])

    const { getDailyMetrics } = await import('../metrics')
    const metrics = await getDailyMetrics()

    // Date should be in YYYY-MM-DD format
    expect(metrics.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Should be today's date
    const today = new Date().toISOString().split('T')[0]
    expect(metrics.date).toBe(today)
  })

  it('should query the Jobs Pipeline table', async () => {
    mockAll.mockResolvedValue([])

    const { getDailyMetrics } = await import('../metrics')
    await getDailyMetrics()

    // All 7 calls should target 'Jobs Pipeline'
    expect(mockBaseCall).toHaveBeenCalledWith('Jobs Pipeline')
    expect(mockBaseCall).toHaveBeenCalledTimes(7)
  })
})
