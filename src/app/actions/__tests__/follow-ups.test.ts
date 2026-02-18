import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ get: vi.fn() })),
}))

// Mock airtable (getBase) for fetching job record
const mockFind = vi.fn()
const mockBaseCall = vi.fn(() => ({ find: mockFind }))
vi.mock('@/lib/airtable', () => ({
  getBase: () => mockBaseCall,
}))

// Mock AI generateText
const mockGenerateText = vi.fn()
vi.mock('@/lib/ai', () => ({
  generateText: (...args: any[]) => mockGenerateText(...args),
}))

describe('generateFollowUpMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEETO_CAL_LINK', 'https://cal.neeto.com/steve/30min')
  })

  it('should return generated message for valid stage (Touchpoint 1)', async () => {
    mockFind.mockResolvedValue({
      id: 'rec1',
      get: (field: string) => {
        const data: Record<string, any> = {
          'Job ID': 'job1',
          'Job Title': 'CRM Dashboard',
          'Job Description': 'Build a CRM',
          'Stage': '📆 Touchpoint 1',
          'Scraped At': '2026-02-10T10:00:00Z',
          'Loom URL': 'https://loom.com/share/abc',
        }
        return data[field]
      },
    })
    mockGenerateText.mockResolvedValue('Hey, quick thought about that dashboard prototype...')

    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec1', '📆 Touchpoint 1')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Hey, quick thought about that dashboard prototype...')
    expect(mockGenerateText).toHaveBeenCalledOnce()
  })

  it('should return generated message for Touchpoint 2', async () => {
    mockFind.mockResolvedValue({
      id: 'rec2',
      get: (field: string) => {
        const data: Record<string, any> = {
          'Job ID': 'job2',
          'Job Title': 'Analytics App',
          'Job Description': 'Build analytics',
          'Stage': '📆 Touchpoint 2',
          'Scraped At': '2026-02-10T10:00:00Z',
          'Loom URL': null,
        }
        return data[field]
      },
    })
    mockGenerateText.mockResolvedValue('Would love to chat about turning this into a full project.')

    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec2', '📆 Touchpoint 2')

    expect(result.success).toBe(true)
    expect(result.message).toContain('full project')
  })

  it('should return generated message for Touchpoint 3', async () => {
    mockFind.mockResolvedValue({
      id: 'rec3',
      get: (field: string) => {
        const data: Record<string, any> = {
          'Job ID': 'job3',
          'Job Title': 'Dashboard App',
          'Job Description': 'Build a dashboard',
          'Stage': '📆 Touchpoint 3',
          'Scraped At': '2026-02-10T10:00:00Z',
          'Loom URL': null,
        }
        return data[field]
      },
    })
    mockGenerateText.mockResolvedValue('If the prototype wasn\'t quite right, happy to adjust.')

    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec3', '📆 Touchpoint 3')

    expect(result.success).toBe(true)
    expect(result.message).toContain('adjust')
  })

  it('should reject unknown stages', async () => {
    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec1', '🧐 Light Engagement')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('should return error when AI generation fails', async () => {
    mockFind.mockResolvedValue({
      id: 'rec1',
      get: (field: string) => {
        const data: Record<string, any> = {
          'Job ID': 'job1',
          'Job Title': 'Test Job',
          'Job Description': 'Test',
          'Stage': '📆 Touchpoint 1',
          'Scraped At': '2026-02-10T10:00:00Z',
          'Loom URL': null,
        }
        return data[field]
      },
    })
    mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'))

    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec1', '📆 Touchpoint 1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('API rate limit')
  })

  it('should return error when Airtable fetch fails', async () => {
    mockFind.mockRejectedValue(new Error('Record not found'))

    const { generateFollowUpMessage } = await import('../follow-ups')
    const result = await generateFollowUpMessage('rec999', '📆 Touchpoint 1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Record not found')
  })
})
