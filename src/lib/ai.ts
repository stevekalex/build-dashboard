import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return _client
}

/**
 * Generate text using GPT-4o-mini (fast + cheap for short structured messages).
 */
export async function generateText(prompt: string): Promise<string> {
  const client = getClient()
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.choices[0]?.message?.content
  if (content) {
    return content
  }
  throw new Error('No content in OpenAI response')
}
