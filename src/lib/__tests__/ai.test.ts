import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the Anthropic SDK
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = { create: mockCreate }
    },
  }
})

describe('generateText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should call Anthropic with correct model and prompt', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Generated message' }],
    })

    const { generateText } = await import('../ai')
    await generateText('Write a follow-up message')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
        messages: [{ role: 'user', content: 'Write a follow-up message' }],
      })
    )
  })

  it('should return the generated text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello from AI' }],
    })

    const { generateText } = await import('../ai')
    const result = await generateText('Test prompt')

    expect(result).toBe('Hello from AI')
  })

  it('should set max_tokens to 1024', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Response' }],
    })

    const { generateText } = await import('../ai')
    await generateText('Test prompt')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 1024,
      })
    )
  })

  it('should throw on API error', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit'))

    const { generateText } = await import('../ai')
    await expect(generateText('Test')).rejects.toThrow('API rate limit')
  })
})
