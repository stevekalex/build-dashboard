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

describe('getPipelineCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AIRTABLE_API_KEY', 'test-key')
    vi.stubEnv('AIRTABLE_BASE_ID', 'test-base')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return all expected fields with correct types', async () => {
    mockAll.mockResolvedValue([])

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts).toHaveProperty('new')
    expect(counts).toHaveProperty('pendingApproval')
    expect(counts).toHaveProperty('approved')
    expect(counts).toHaveProperty('building')
    expect(counts).toHaveProperty('deployed')
    expect(counts).toHaveProperty('applied')
    expect(counts).toHaveProperty('followUps')
    expect(counts).toHaveProperty('engaging')
    expect(counts).toHaveProperty('closedWon')
    expect(counts).toHaveProperty('closedLost')
    expect(counts).toHaveProperty('buildFailed')
    expect(counts).toHaveProperty('rejected')

    // All should be numbers
    for (const value of Object.values(counts)) {
      expect(typeof value).toBe('number')
    }
  })

  it('should return all zeros when no records exist', async () => {
    mockAll.mockResolvedValue([])

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts).toEqual({
      new: 0,
      pendingApproval: 0,
      approved: 0,
      building: 0,
      deployed: 0,
      applied: 0,
      followUps: 0,
      engaging: 0,
      closedWon: 0,
      closedLost: 0,
      buildFailed: 0,
      rejected: 0,
    })
  })

  it('should correctly count multiple records per stage', async () => {
    const mockRecords = [
      makeRecord('🆕 New'),
      makeRecord('🆕 New'),
      makeRecord('🆕 New'),
      makeRecord('⏸️ Pending Approval'),
      makeRecord('⏸️ Pending Approval'),
      makeRecord('✅ Approved'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.new).toBe(3)
    expect(counts.pendingApproval).toBe(2)
    expect(counts.approved).toBe(1)
  })

  it('should count both Deployed and Prototype Built as deployed', async () => {
    const mockRecords = [
      makeRecord('🏗️ Deployed'),
      makeRecord('🏗️ Deployed'),
      makeRecord('🎁 Prototype Built'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.deployed).toBe(3)
  })

  it('should count Send Loom as deployed', async () => {
    const mockRecords = [
      makeRecord('🎥 Send Loom'),
      makeRecord('🏗️ Deployed'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.deployed).toBe(2)
  })

  it('should count all touchpoint stages as followUps', async () => {
    const mockRecords = [
      makeRecord('📆 Touchpoint 1'),
      makeRecord('📆 Touchpoint 2'),
      makeRecord('📆 Touchpoint 3'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.followUps).toBe(3)
  })

  it('should count both engagement stages as engaging', async () => {
    const mockRecords = [
      makeRecord('🧐 Light Engagement'),
      makeRecord('🕺 Engagement with prototype'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.engaging).toBe(2)
  })

  it('should count Initial message sent as applied', async () => {
    const mockRecords = [
      makeRecord('💌 Initial message sent'),
      makeRecord('💌 Initial message sent'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.applied).toBe(2)
  })

  it('should correctly count terminal stages', async () => {
    const mockRecords = [
      makeRecord('🏁 Closed Won'),
      makeRecord('🏁 Closed Won'),
      makeRecord('➡️ Closed Lost'),
      makeRecord('⚠️ Build Failed'),
      makeRecord('🚫 Rejected'),
      makeRecord('🚫 Rejected'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.closedWon).toBe(2)
    expect(counts.closedLost).toBe(1)
    expect(counts.buildFailed).toBe(1)
    expect(counts.rejected).toBe(2)
  })

  it('should request only the Stage field with maxRecords 500', async () => {
    mockAll.mockResolvedValue([])

    const { getPipelineCounts } = await import('../pipeline')
    await getPipelineCounts()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: ['Stage'],
        maxRecords: 500,
      })
    )
  })

  it('should handle records with empty/null stage gracefully', async () => {
    const mockRecords = [
      makeRecord(''),
      makeRecord(null as unknown as string),
      makeRecord('🆕 New'),
    ]

    mockAll.mockResolvedValue(mockRecords)

    const { getPipelineCounts } = await import('../pipeline')
    const counts = await getPipelineCounts()

    expect(counts.new).toBe(1)
    // Ensure total doesn't break — empty stages are just ignored
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(1)
  })
})

/** Helper to create a mock Airtable record with a given Stage value */
function makeRecord(stage: string) {
  return {
    id: `rec${Math.random().toString(36).slice(2, 8)}`,
    get: (field: string) => {
      if (field === 'Stage') return stage
      return undefined
    },
  }
}
