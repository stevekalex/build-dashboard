import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return _client
}

/**
 * Generate text using Claude Haiku 4.5 (fast + cheap for short structured messages).
 */
export async function generateText(prompt: string): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (block.type === 'text') {
    return block.text
  }
  throw new Error('Unexpected response type from Anthropic API')
}
