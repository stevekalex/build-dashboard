import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the OpenAI SDK
const mockCreate = vi.fn()
vi.mock('openai', () => {
  return {
    default: class {
      chat = { completions: { create: mockCreate } }
    },
  }
})

describe('generateText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should call OpenAI with correct model and prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Generated message' } }],
    })

    const { generateText } = await import('../ai')
    await generateText('Write a follow-up message')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Write a follow-up message' }],
      })
    )
  })

  it('should return the generated text', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello from AI' } }],
    })

    const { generateText } = await import('../ai')
    const result = await generateText('Test prompt')

    expect(result).toBe('Hello from AI')
  })

  it('should set max_tokens to 1024', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Response' } }],
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
